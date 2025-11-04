import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { IStartExamDto, ISubmitExamDto } from '../interfaces/exam.interface';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async startExam(data: IStartExamDto, user: IUserSession) {
    // Check if subject exists
    const subject = await this.prisma.subjects.findUnique({
      where: { id: data.subjectId, isDeleted: false },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    // Check if user has any active exam session (for any subject)
    const existingActiveSession = await this.prisma.examSessions.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
      select: {
        id: true,
        questionIds: true,
        subjectId: true,
        startedAt: true,
        timeLimit: true,
        questions: true,
      },
    });

    if (existingActiveSession) {
      // If user has active session for the same subject, return existing session
      if (existingActiveSession.subjectId === data.subjectId) {
        // Calculate remaining time
        const timeSpent = Math.floor(
          (new Date().getTime() - existingActiveSession.startedAt.getTime()) / (1000 * 60),
        );
        const remainingTime = Math.max(0, existingActiveSession.timeLimit - timeSpent);

        // Check if session has expired
        if (remainingTime <= 0) {
          // Auto-expire the session
          await this.prisma.examSessions.update({
            where: { id: existingActiveSession.id },
            data: {
              status: 'expired',
              endedAt: new Date(),
            },
          });

          // Create exam result with 0 score for expired session
          await this.prisma.examResults.create({
            data: {
              userId: user.id,
              subjectId: existingActiveSession.subjectId,
              sessionId: existingActiveSession.id,
              score: 0,
              totalQuestions: 20,
              correctAnswers: 0,
              timeSpent: existingActiveSession.timeLimit,
              completedAt: new Date(),
            },
          });

          // Continue with creating new session (fall through to the rest of the method)
        } else {
          // Return existing active session
          const sessionQuestions = existingActiveSession.questions as Array<{
            id: string;
            title: string;
            answers: Array<{ id: string; title: string; index: number }>;
          }>;
          return {
            sessionId: existingActiveSession.id,
            questions: sessionQuestions.map((q) => ({
              id: q.id,
              title: q.title,
              answers: q.answers,
            })),
            timeLimit: existingActiveSession.timeLimit,
            startedAt: existingActiveSession.startedAt,
            isResumed: true,
            remainingTime,
          };
        }
      } else {
        // User has active session for different subject
        throw new BadRequestException(
          'You already have an active exam session for another subject. Please complete or finish your current exam before starting a new one.',
        );
      }
    }

    // Get all questions from subject with answers
    const questions = await this.prisma.questions.findMany({
      where: {
        subjectId: data.subjectId,
        isDeleted: false,
      },
      include: {
        answers: {
          where: { isDeleted: false },
          select: {
            id: true,
            title: true,
            isCorrect: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (questions.length < 20) {
      throw new BadRequestException(
        `Insufficient questions available for this subject. Required: 20, Available: ${questions.length}`,
      );
    }

    // Validate that each question has at least 2 answers and exactly one correct answer
    const invalidQuestions = questions.filter((q) => {
      const correctAnswers = q.answers.filter((a) => a.isCorrect);
      return q.answers.length < 2 || correctAnswers.length !== 1;
    });

    if (invalidQuestions.length > 0) {
      throw new BadRequestException(
        'Some questions do not have enough answer options or do not have exactly one correct answer',
      );
    }

    // Shuffle and take 20 questions
    const shuffledQuestions = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, 20)
      .map((q, index) => ({ ...q, orderIndex: index + 1 }));

    // Prepare questions for exam (without exposing correct answers to client)
    const examQuestions = shuffledQuestions.map((q) => {
      // Shuffle answer options and track the correct answer's new position
      const shuffledAnswers = q.answers.sort(() => Math.random() - 0.5);

      return {
        id: q.id,
        title: q.title,
        orderIndex: q.orderIndex,
        answers: shuffledAnswers.map((a, index) => ({
          id: a.id,
          title: a.title,
          index: index,
        })),
      };
    });

    // Create exam session
    const examSession = await this.prisma.examSessions.create({
      data: {
        userId: user.id,
        subjectId: data.subjectId,
        questions: examQuestions,
        startedAt: new Date(),
        timeLimit: 60, // default 60 minutes
        status: 'active',
        totalQuestions: 20,
        questionIds: shuffledQuestions.map((q) => q.id),
      },
    });

    return {
      sessionId: examSession.id,
      questions: examQuestions.map((q) => ({
        id: q.id,
        title: q.title,
        answers: q.answers, // Only send answers without correct answer info
      })),
      timeLimit: examSession.timeLimit,
      startedAt: examSession.startedAt,
    };
  }

  async submitExam(sessionId: string, data: ISubmitExamDto, user: IUserSession) {
    // Get exam session
    const session = await this.prisma.examSessions.findUnique({
      where: { id: sessionId, userId: user.id },
    });

    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Exam session is not active');
    }

    // Check if time limit exceeded
    const timeSpent = Math.floor(
      (new Date().getTime() - session.startedAt.getTime()) / (1000 * 60),
    );
    if (timeSpent > session.timeLimit) {
      await this.prisma.examSessions.update({
        where: { id: sessionId },
        data: { status: 'expired' },
      });
      throw new BadRequestException('Time limit exceeded');
    }

    // Validate submission
    if (!data.answers || data.answers.length === 0) {
      throw new BadRequestException('No answers provided');
    }

    if (data.answers.length > session.totalQuestions) {
      throw new BadRequestException('Too many answers provided');
    }

    // Validate that all question IDs exist in the session
    const sessionQuestions = session.questions as Array<{
      id: string;
      title: string;
      orderIndex: number;
      answers: Array<{ id: string; title: string; index: number }>;
    }>;
    const sessionQuestionIds = sessionQuestions.map((q) => q.id);
    const invalidAnswers = data.answers.filter((a) => !sessionQuestionIds.includes(a.questionId));

    if (invalidAnswers.length > 0) {
      throw new BadRequestException('Invalid question IDs in answers');
    }

    // Calculate score
    let correctCount = 0;
    const answersWithResults = data.answers.map((userAnswer) => {
      return {
        questionId: userAnswer.questionId,
        userAnswer: userAnswer.answer,
      };
    });

    const score = Math.round((correctCount / session.totalQuestions) * 100); // Use total questions, not just answered

    // Update exam session
    await this.prisma.examSessions.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        endedAt: new Date(),
        score,
        correctAnswers: correctCount,
        answers: answersWithResults,
      },
    });

    // Create exam result
    await this.prisma.examResults.create({
      data: {
        userId: user.id,
        subjectId: session.subjectId,
        sessionId: sessionId,
        score,
        totalQuestions: session.totalQuestions,
        correctAnswers: correctCount,
        timeSpent,
        completedAt: new Date(),
      },
    });

    return {
      score,
      correctAnswers: correctCount,
      totalQuestions: session.totalQuestions,
      timeSpent,
      passed: score >= 70, // 70% to pass
    };
  }

  async getExamSession(sessionId: string, user: IUserSession) {
    const session = await this.prisma.examSessions.findUnique({
      where: { id: sessionId, userId: user.id },
      include: {
        subject: { select: { name: true } },
      },
    });

    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    return session;
  }

  async getUserExamHistory(user: IUserSession) {
    const results = await this.prisma.examResults.findMany({
      where: { userId: user.id },
      include: {
        subject: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    return results;
  }

  async getSubjectExamResults(subjectId: string) {
    const results = await this.prisma.examResults.findMany({
      where: { subjectId },
      include: {
        user: { select: { fullName: true, email: true } },
        subject: { select: { name: true } },
      },
      orderBy: { completedAt: 'desc' },
    });

    return results;
  }

  async getActiveSession(user: IUserSession) {
    const activeSession = await this.prisma.examSessions.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
      include: {
        subject: { select: { name: true } },
      },
    });

    if (!activeSession) {
      return { hasActiveSession: false, session: null };
    }

    // Calculate remaining time
    const timeSpent = Math.floor(
      (new Date().getTime() - activeSession.startedAt.getTime()) / (1000 * 60),
    );
    const remainingTime = Math.max(0, activeSession.timeLimit - timeSpent);

    // Auto-expire session if time limit exceeded
    if (remainingTime <= 0) {
      await this.prisma.examSessions.update({
        where: { id: activeSession.id },
        data: {
          status: 'expired',
          endedAt: new Date(),
        },
      });

      // Create exam result with 0 score for expired session
      await this.prisma.examResults.create({
        data: {
          userId: user.id,
          subjectId: activeSession.subjectId,
          sessionId: activeSession.id,
          score: 0,
          totalQuestions: activeSession.totalQuestions,
          correctAnswers: 0,
          timeSpent: activeSession.timeLimit,
          completedAt: new Date(),
        },
      });

      return {
        hasActiveSession: false,
        session: null,
        message: 'Your exam session has expired due to time limit',
      };
    }

    return {
      hasActiveSession: true,
      session: {
        id: activeSession.id,
        subjectName: activeSession.subject.name,
        startedAt: activeSession.startedAt,
        timeLimit: activeSession.timeLimit,
        timeSpent,
        remainingTime,
        totalQuestions: activeSession.totalQuestions,
        questions: activeSession.questions,
      },
    };
  }

  async finishExam(sessionId: string, user: IUserSession) {
    // Get exam session
    const session = await this.prisma.examSessions.findUnique({
      where: { id: sessionId, userId: user.id },
    });

    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    if (session.status !== 'active') {
      throw new BadRequestException('Exam session is not active');
    }

    // Calculate time spent
    const timeSpent = Math.floor(
      (new Date().getTime() - session.startedAt.getTime()) / (1000 * 60),
    );

    // Update exam session to completed without answers
    await this.prisma.examSessions.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        endedAt: new Date(),
        score: 0, // No score since no answers submitted
        correctAnswers: 0,
      },
    });

    // Create exam result with 0 score
    await this.prisma.examResults.create({
      data: {
        userId: user.id,
        subjectId: session.subjectId,
        sessionId: sessionId,
        score: 0,
        totalQuestions: session.totalQuestions,
        correctAnswers: 0,
        timeSpent,
        completedAt: new Date(),
      },
    });

    return {
      message: 'Exam finished successfully',
      score: 0,
      correctAnswers: 0,
      totalQuestions: session.totalQuestions,
      timeSpent,
      passed: false,
    };
  }
}

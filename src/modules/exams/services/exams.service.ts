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

    // Check if user has active exam session for this subject
    const activeSession = await this.prisma.examSessions.findFirst({
      where: {
        userId: user.id,
        subjectId: data.subjectId,
        status: 'active',
      },
    });

    if (activeSession) {
      throw new BadRequestException('You already have an active exam session for this subject');
    }

    // Check if user has any active exam session (for any subject)
    const anyActiveSession = await this.prisma.examSessions.findFirst({
      where: {
        userId: user.id,
        status: 'active',
      },
      include: {
        subject: { select: { name: true } },
      },
    });

    if (anyActiveSession) {
      throw new BadRequestException('You currently have an active exam session for another subject. Please finish it first.');
    }

    // Get 20 random questions from subject with answers
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
    });

    if (questions.length < 20) {
      throw new BadRequestException(`Insufficient questions available for this subject. Required: 20, Available: ${questions.length}`);
    }

    // Validate that each question has at least 2 answers
    const invalidQuestions = questions.filter(q => q.answers.length < 2);
    if (invalidQuestions.length > 0) {
      throw new BadRequestException('Some questions do not have enough answer options');
    }

    // Shuffle and take 20 questions
    const shuffledQuestions = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, 20)
      .map((q, index) => ({ ...q, orderIndex: index + 1 }));

    // Prepare questions for exam (without correct answers)
    const examQuestions = shuffledQuestions.map(q => ({
      id: q.id,
      title: q.title,
      orderIndex: q.orderIndex,
      answers: q.answers
        .sort(() => Math.random() - 0.5) // Shuffle answer options
        .map((a, index) => ({
          id: a.id,
          title: a.title,
          index: index,
        })),
      correctAnswerIndex: q.correctAnswerIndex,
    }));

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
      },
    });

    return {
      sessionId: examSession.id,
      questions: examQuestions.map(q => ({
        id: q.id,
        title: q.title,
        answers: q.answers,
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
    const timeSpent = Math.floor((new Date().getTime() - session.startedAt.getTime()) / (1000 * 60));
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
    const sessionQuestions = session.questions as any[];
    const sessionQuestionIds = sessionQuestions.map(q => q.id);
    const invalidAnswers = data.answers.filter(a => !sessionQuestionIds.includes(a.questionId));
    
    if (invalidAnswers.length > 0) {
      throw new BadRequestException('Invalid question IDs in answers');
    }

    // Get questions with correct answers
    const questionIds = data.answers.map(a => a.questionId);
    const questions = await this.prisma.questions.findMany({
      where: { id: { in: questionIds } },
      select: { id: true, correctAnswerIndex: true },
    });

    // Calculate score
    let correctCount = 0;
    const answersWithResults = data.answers.map(userAnswer => {
      const question = questions.find(q => q.id === userAnswer.questionId);
      
      // Validate answer index
      if (userAnswer.answer < 0) {
        throw new BadRequestException(`Invalid answer index for question ${userAnswer.questionId}`);
      }
      
      const isCorrect = question && question.correctAnswerIndex === userAnswer.answer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: userAnswer.questionId,
        userAnswer: userAnswer.answer,
        correctAnswer: question?.correctAnswerIndex,
        isCorrect,
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
    const timeSpent = Math.floor((new Date().getTime() - activeSession.startedAt.getTime()) / (1000 * 60));
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
        message: 'Your exam session has expired due to time limit'
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
    const timeSpent = Math.floor((new Date().getTime() - session.startedAt.getTime()) / (1000 * 60));

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

  // Admin functionality
  async getAllExamSessions(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      this.prisma.examSessions.findMany({
        skip,
        take: limit,
        include: {
          user: { select: { fullName: true, email: true } },
          subject: { select: { name: true } },
        },
        orderBy: { startedAt: 'desc' },
      }),
      this.prisma.examSessions.count(),
    ]);

    return {
      data: sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getExamStatistics(subjectId?: string) {
    const whereClause = subjectId ? { subjectId } : {};

    const [
      totalExams,
      completedExams,
      averageScore,
      passedExams,
      expiredExams,
    ] = await Promise.all([
      this.prisma.examResults.count({ where: whereClause }),
      this.prisma.examResults.count({ 
        where: { ...whereClause, score: { gt: 0 } } 
      }),
      this.prisma.examResults.aggregate({
        where: whereClause,
        _avg: { score: true },
      }),
      this.prisma.examResults.count({ 
        where: { ...whereClause, score: { gte: 70 } } 
      }),
      this.prisma.examSessions.count({ 
        where: { ...whereClause, status: 'expired' } 
      }),
    ]);

    return {
      totalExams,
      completedExams,
      averageScore: Math.round(averageScore._avg.score || 0),
      passedExams,
      expiredExams,
      passRate: totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0,
      completionRate: totalExams > 0 ? Math.round((completedExams / totalExams) * 100) : 0,
    };
  }

  async deleteExamSession(sessionId: string, _adminUser: IUserSession) {
    const session = await this.prisma.examSessions.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Exam session not found');
    }

    // Delete related exam results first
    await this.prisma.examResults.deleteMany({
      where: { sessionId },
    });

    // Delete the session
    await this.prisma.examSessions.delete({
      where: { id: sessionId },
    });

    return { message: 'Exam session deleted successfully' };
  }

  async expireAllActiveSessions() {
    const activeSessions = await this.prisma.examSessions.findMany({
      where: { status: 'active' },
    });

    const expiredSessions = [];

    for (const session of activeSessions) {
      const timeSpent = Math.floor((new Date().getTime() - session.startedAt.getTime()) / (1000 * 60));
      
      if (timeSpent > session.timeLimit) {
        await this.prisma.examSessions.update({
          where: { id: session.id },
          data: { 
            status: 'expired',
            endedAt: new Date(),
          },
        });

        // Create exam result for expired session
        await this.prisma.examResults.create({
          data: {
            userId: session.userId,
            subjectId: session.subjectId,
            sessionId: session.id,
            score: 0,
            totalQuestions: session.totalQuestions,
            correctAnswers: 0,
            timeSpent: session.timeLimit,
            completedAt: new Date(),
          },
        });

        expiredSessions.push(session.id);
      }
    }

    return {
      message: `Expired ${expiredSessions.length} sessions`,
      expiredSessions,
    };
  }
}

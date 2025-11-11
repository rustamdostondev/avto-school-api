import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { IStartExamDto } from '../interfaces/exam.interface';

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
    const existingActiveSession = await this.prisma.exams.findFirst({
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
          await this.prisma.exams.update({
            where: { id: existingActiveSession.id },
            data: {
              status: 'expired',
              endedAt: new Date(),
            },
          });

          // Continue with creating new session (fall through to the rest of the method)
        } else {
          // Return existing active session
          const sessionQuestions = existingActiveSession.questionIds as Array<string>;
          return {
            sessionId: existingActiveSession.id,
            questions: sessionQuestions,
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
    const examSession = await this.prisma.exams.create({
      data: {
        userId: user.id,
        subjectId: data.subjectId,
        startedAt: new Date(),
        timeLimit: 60, // default 60 minutes
        status: 'active',
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
}

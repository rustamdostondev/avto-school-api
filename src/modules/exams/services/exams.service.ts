import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { IStartExamDto } from '../interfaces/exam.interface';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExamsService {
  constructor(private readonly prisma: PrismaService) {}

  async startExam(data: IStartExamDto, user: IUserSession) {
    // Check for existing active exam
    const existingExam = await this.findActiveExam(user.id, data);
    if (existingExam) return this.formatExamResponse(existingExam, undefined);

    // Validate exam type requirements
    await this.validateExamType(data);

    // Get questions based on exam type
    const questions = await this.getQuestionsByType(data);

    // Create new exam session
    const examSession = await this.createExamSession(data, user.id, questions);

    return this.formatExamResponse(examSession, questions);
  }

  async finish(sessionId: string, submitDto: { correctQuestionIds: string[] }, user: IUserSession) {
    // Find the active exam session
    const examSession = await this.prisma.exams.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
        status: 'active',
        isDeleted: false,
      },
    });

    if (!examSession) {
      throw new NotFoundException('Active exam session not found');
    }

    const correctQuestionIds = submitDto.correctQuestionIds;
    const correctCount = correctQuestionIds.length;

    // Update exam session with correct question IDs and finish the exam
    return await this.prisma.exams.update({
      where: { id: sessionId },
      data: {
        correctQuestionsIds: correctQuestionIds,
        correctQuestionCount: correctCount,
        status: 'completed',
        endedAt: new Date(),
      },
      select: {
        id: true,
        correctQuestionCount: true,
        questionCount: true,
      },
    });
  }

  async getExamStatistics(user: IUserSession) {
    // Get all exam counts by status for the user
    const examCounts = await this.prisma.exams.groupBy({
      by: ['status'],
      where: {
        userId: user.id,
        isDeleted: false,
      },
      _count: {
        status: true,
      },
    });

    // Get the highest score from completed exams
    const highestScoreExam = await this.prisma.exams.findFirst({
      where: {
        userId: user.id,
        status: 'completed',
        isDeleted: false,
      },
      orderBy: {
        correctQuestionCount: 'desc',
      },
      select: {
        correctQuestionCount: true,
        questionCount: true,
      },
    });

    // Get the most recent exam to calculate days since last exam
    const lastExam = await this.prisma.exams.findFirst({
      where: {
        userId: user.id,
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        createdAt: true,
      },
    });

    // Initialize default counts
    const statistics = {
      completed: 0,
      active: 0,
      expired: 0,
      total: 0,
    };

    // Map the results to our statistics object
    examCounts.forEach((item) => {
      const count = item._count.status;
      statistics.total += count;

      switch (item.status) {
        case 'completed':
          statistics.completed = count;
          break;
        case 'active':
          statistics.active = count;
          break;
        case 'expired':
          statistics.expired = count;
          break;
      }
    });

    // Calculate highest score percentage
    const highestScore = highestScoreExam
      ? Math.round((highestScoreExam.correctQuestionCount / highestScoreExam.questionCount) * 100)
      : 0;

    // Calculate days since last exam
    const daysSinceLastExam = lastExam
      ? Math.floor((Date.now() - lastExam.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      totalExams: statistics.total,
      completedExams: statistics.completed,
      activeExams: statistics.active,
      expiredExams: statistics.expired,
      statistics: [
        {
          label: {
            uz: 'Ишланган тестлар',
            oz: 'Ishlangan testlar',
            ru: 'Выполненные тесты',
          },
          count: statistics.completed,
          type: 'completed',
        },
        {
          label: {
            uz: 'Энг юқори натижа',
            oz: 'Eng yuqori natija',
            ru: 'Наиболее высокий результат',
          },
          count: highestScore,
          type: 'percentage',
        },
        {
          label: {
            uz: 'Сўнгги тест',
            oz: 'Songgi test',
            ru: 'Последний тест',
          },
          count: daysSinceLastExam,
          type: 'days',
        },
      ],
    };
  }

  private findActiveExam(userId: string, data: IStartExamDto) {
    const whereClause: Prisma.ExamsWhereInput = {
      userId,
      status: 'active',
      type: data.type,
      isDeleted: false,
    };

    if (data.type === 'SUBJECT' && data.subjectId) {
      whereClause.subjectId = data.subjectId;
    } else if (data.type === 'TICKET' && data.ticketId) {
      whereClause.ticketId = data.ticketId;
    }

    return this.prisma.exams.findFirst({
      where: whereClause,
      include: {
        subject: true,
        ticket: true,
      },
    });
  }

  private async validateExamType(data: IStartExamDto) {
    if (data.type === 'SUBJECT') {
      if (!data.subjectId) {
        throw new BadRequestException('Subject ID is required for SUBJECT exam type');
      }
      const subject = await this.prisma.subjects.findUnique({
        where: { id: data.subjectId, isDeleted: false },
      });
      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    } else if (data.type === 'TICKET') {
      if (!data.ticketId) {
        throw new BadRequestException('Ticket ID is required for TICKET exam type');
      }
      const ticket = await this.prisma.tickets.findUnique({
        where: { id: data.ticketId, isDeleted: false },
      });
      if (!ticket) {
        throw new NotFoundException('Ticket not found');
      }
    }
  }

  private async getQuestionsByType(data: IStartExamDto) {
    const whereClause: Prisma.QuestionsWhereInput = { isDeleted: false };
    const randomQuestionCount = 20;

    switch (data.type) {
      case 'SUBJECT':
        whereClause.subjectId = data.subjectId;
        break;
      case 'TICKET':
        whereClause.ticketId = data.ticketId;
        break;
      case 'RANDOM':
        // No additional filter for random questions
        break;
    }

    const questions = await this.prisma.questions.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        createdAt: true,
        file: {
          select: { id: true, name: true, path: true },
        },
        answers: {
          where: { isDeleted: false },
          select: { id: true, title: true, isCorrect: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Validate questions based on exam type
    if (data.type === 'RANDOM') {
      // For RANDOM type, we need at least 20 questions
      this.validateQuestions(questions, randomQuestionCount);
      return questions.sort(() => Math.random() - 0.5).slice(0, randomQuestionCount);
    } else {
      // For SUBJECT and TICKET types, we need at least 1 question
      this.validateQuestions(questions, 1);
      return questions;
    }
  }

  private validateQuestions(questions, requiredCount: number = 20) {
    if (questions.length < requiredCount) {
      throw new BadRequestException(
        `Insufficient questions available. Required: ${requiredCount}, Available: ${questions.length}`,
      );
    }

    const invalidQuestions = questions.filter((q) => {
      const correctAnswers = q.answers.filter((a) => a.isCorrect);
      return q.answers.length < 2 || correctAnswers.length !== 1;
    });

    if (invalidQuestions.length > 0) {
      throw new BadRequestException(
        'Some questions do not have enough answer options or do not have exactly one correct answer',
      );
    }
  }

  private createExamSession(data: IStartExamDto, userId: string, questions) {
    const questionIds = questions.map((q) => q.id);
    const startTime = new Date();
    const timeLimit = questions.length; // 1 minute per question

    return this.prisma.exams.create({
      data: {
        userId,
        subjectId: data.subjectId || null,
        ticketId: data.ticketId || null,
        type: data.type,
        startedAt: startTime,
        timeLimit: timeLimit,
        status: 'active',
        questionIds,
        correctQuestionsIds: [],
        questionCount: questions.length,
        correctQuestionCount: 0,
      },
      include: {
        subject: true,
        ticket: true,
      },
    });
  }

  private async formatExamResponse(examSession, questions) {
    // If questions are not provided, we need to fetch them for existing exam
    if (!questions) {
      // For existing exam, fetch questions by IDs
      const timeSpent = Math.floor((Date.now() - examSession.startedAt.getTime()) / (1000 * 60));
      const remainingTime = Math.max(0, examSession.timeLimit - timeSpent);

      if (remainingTime <= 0) {
        // Auto-expire the session
        await this.prisma.exams.update({
          where: { id: examSession.id },
          data: { status: 'expired', endedAt: new Date() },
        });
      }

      // Fetch questions by their IDs to return complete question data
      const existingQuestions = await this.prisma.questions.findMany({
        where: {
          id: { in: examSession.questionIds },
          isDeleted: false,
        },
        select: {
          id: true,
          title: true,
          createdAt: true,
          file: {
            select: { id: true, name: true, path: true },
          },
          answers: {
            where: { isDeleted: false },
            select: { id: true, title: true, isCorrect: true },
          },
        },
      });

      // Format questions for response in the same order as stored in questionIds
      const formattedQuestions = examSession.questionIds
        .map((questionId: string) => {
          const question = existingQuestions.find((q) => q.id === questionId);
          if (!question) return null;

          return {
            id: question.id,
            title: question.title,
            file: question.file || null,
            answers: question.answers
              .sort(() => Math.random() - 0.5)
              .map((a) => ({
                id: a.id,
                title: a.title,
                isCorrect: a.isCorrect,
              })),
          };
        })
        .filter(Boolean);

      // Calculate expected end time
      const expectedEndTime = new Date(
        examSession.startedAt.getTime() + examSession.timeLimit * 60 * 1000,
      );

      return {
        sessionId: examSession.id,
        type: examSession.type,
        subject: examSession.subject || null,
        ticket: examSession.ticket || null,
        questions: formattedQuestions,
        timeLimit: examSession.timeLimit,
        startedAt: examSession.startedAt,
        endTime: expectedEndTime,
        isResumed: true,
        remainingTime,
        questionCount: examSession.questionCount,
      };
    }

    // For new exam, return formatted questions
    const examQuestions = questions.map((q) => ({
      id: q.id,
      title: q.title,
      file: q.file || null,
      answers: q.answers
        .sort(() => Math.random() - 0.5)
        .map((a) => ({
          id: a.id,
          title: a.title,
          isCorrect: a.isCorrect,
        })),
    }));

    // Calculate expected end time for new exam
    const expectedEndTime = new Date(
      examSession.startedAt.getTime() + examSession.timeLimit * 60 * 1000,
    );

    return {
      sessionId: examSession.id,
      type: examSession.type,
      subject: examSession.subject || null,
      ticket: examSession.ticket || null,
      questions: examQuestions,
      timeLimit: examSession.timeLimit,
      startedAt: examSession.startedAt,
      endTime: expectedEndTime,
      questionCount: examSession.questionCount,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { CreateSavedQuestionDto } from '../dto/create-saved-question.dto';
import { UpdateSavedQuestionDto } from '../dto/update-saved-question.dto';
import { FilterSavedQuestionsDto } from '../dto/filter-saved-questions.dto';
import { IApiResponse } from '@common/interfaces/api-response.interface';
import { CustomApiResponse } from '@common/utils/api-response.util';

@Injectable()
export class SavedQuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly select = {
    id: true,
    createdAt: true,
    updatedAt: true,
    question: {
      select: {
        id: true,
        title: true,
        info: true,
        file: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        ticket: {
          select: {
            id: true,
            name: true,
          },
        },
        answers: {
          where: { isDeleted: false },
          select: {
            id: true,
            title: true,
            isCorrect: true,
          },
        },
      },
    },
  } as const;

  async create(
    payload: CreateSavedQuestionDto,
    user: IUserSession,
  ): Promise<{ id: string } | Record<string, unknown>> {
    const existing = await this.prisma.savedQuestions.findFirst({
      where: {
        userId: user.id,
        questionId: payload.questionId,
        isDeleted: false,
      },
    });

    if (existing) {
      return this.prisma.savedQuestions.update({
        where: { id: existing.id },
        data: {
          updatedBy: user.id,
          updatedAt: new Date(),
        },
        select: { id: true },
      });
    }

    const data: Prisma.SavedQuestionsCreateInput = {
      user: { connect: { id: user.id } },
      question: { connect: { id: payload.questionId } },
      createdBy: user.id,
    } as Prisma.SavedQuestionsCreateInput;

    return this.prisma.savedQuestions.create({
      data,
      select: { id: true },
    });
  }

  async findAll(
    payload: FilterSavedQuestionsDto,
    user: IUserSession,
  ): Promise<IApiResponse<unknown[]>> {
    const { limit, page, search, subjectId, ticketId } = payload;

    const where: Prisma.SavedQuestionsWhereInput = {
      isDeleted: false,
      userId: user.id,
      question: {
        isDeleted: false,
      },
    };

    if (subjectId) {
      (where.question as Prisma.QuestionsWhereInput).subjectId = subjectId;
    }

    if (ticketId) {
      (where.question as Prisma.QuestionsWhereInput).ticketId = ticketId;
    }

    if (search) {
      (where.question as Prisma.QuestionsWhereInput).OR = [
        {
          title: {
            path: ['oz'],
            string_contains: search,
          } as Prisma.JsonFilter,
        },
        {
          title: {
            path: ['uz'],
            string_contains: search,
          } as Prisma.JsonFilter,
        },
        {
          title: {
            path: ['ru'],
            string_contains: search,
          } as Prisma.JsonFilter,
        },
        {
          info: {
            path: ['oz'],
            string_contains: search,
          } as Prisma.JsonFilter,
        },
        {
          info: {
            path: ['uz'],
            string_contains: search,
          } as Prisma.JsonFilter,
        },
        {
          info: {
            path: ['ru'],
            string_contains: search,
          } as Prisma.JsonFilter,
        },
      ];
    }

    const [results, total] = await Promise.all([
      this.prisma.savedQuestions.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select: this.select,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.savedQuestions.count({ where }),
    ]);

    return CustomApiResponse.paginated(results, page, limit, total);
  }

  async findOne(id: string, user: IUserSession) {
    const saved = await this.prisma.savedQuestions.findFirst({
      where: {
        id,
        userId: user.id,
        isDeleted: false,
      },
      select: this.select,
    });

    if (!saved) {
      throw new NotFoundException('Saved question not found');
    }

    return saved;
  }

  async update(id: string, payload: UpdateSavedQuestionDto, user: IUserSession) {
    const existing = await this.prisma.savedQuestions.findFirst({
      where: { id, userId: user.id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Saved question not found');
    }

    return this.prisma.savedQuestions.update({
      where: { id },
      data: {
        question: { connect: { id: payload.questionId } },
        updatedBy: user.id,
        updatedAt: new Date(),
      },
      select: this.select,
    });
  }

  async remove(id: string, user: IUserSession) {
    const existing = await this.prisma.savedQuestions.findFirst({
      where: { id, userId: user.id, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException('Saved question not found');
    }

    return this.prisma.savedQuestions.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      },
      select: this.select,
    });
  }
}

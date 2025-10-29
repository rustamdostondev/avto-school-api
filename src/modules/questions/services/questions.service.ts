import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { QuestionListDto } from '../dto/question-list.dto';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { IApiResponse } from '@common/interfaces/api-response.interface';
import { CustomApiResponse } from '@common/utils/api-response.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  select = {
    id: true,
    title: true,
    createdAt: true,
    updatedAt: true,
  };
  async findAll(payload: QuestionListDto): Promise<IApiResponse<unknown[]>> {
    const { limit, page, search, sortBy, order, subjectId, ticketId } = payload;

    const select: Prisma.QuestionsSelect = {
      id: true,
      title: true,
      correctAnswerIndex: true,
      createdAt: true,
      updatedAt: true,
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
      file: {
        select: {
          id: true,
          name: true,
          path: true,
        },
      },
      answers: {
        select: {
          id: true,
          title: true,
          isCorrect: true,
          createdAt: true,
          updatedAt: true,
        },
        where: { isDeleted: false },
      },
    };

    // Build the search condition
    const where: Prisma.QuestionsWhereInput = { isDeleted: false };

    if (search) {
      where.OR = [
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
      ];
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (ticketId) {
      where.ticketId = ticketId;
    }

    const sort =
      Object.keys(select).includes(sortBy) && sortBy ? { [sortBy]: order } : { createdAt: order };

    // Fetch paginated questions
    const [results, total] = await Promise.all([
      this.prisma.questions.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select,
        orderBy: sort,
      }),
      this.prisma.questions.count({ where }),
    ]);

    // Return the paginated response
    return CustomApiResponse.paginated(results, page, limit, total);
  }

  create(createQuestionDto: CreateQuestionDto, user: IUserSession) {
    const { ticketId, subjectId, fileId, title, ...rest } = createQuestionDto;
    const data = {
      ...rest,
      title: title as unknown as Prisma.JsonObject,
      ticket: { connect: { id: ticketId } },
      subject: { connect: { id: subjectId } },
      createdBy: user.id,
      ...(fileId && { file: { connect: { id: fileId } } }),
    };
    return this.prisma.questions.create({ data, select: this.select });
  }

  findOne(id: string) {
    return this.prisma.questions.findFirst({
      where: { id, isDeleted: false },
      include: {
        ...this.select,
        answers: {
          where: { isDeleted: false },
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
        file: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });
  }

  update(id: string, updateQuestionDto: UpdateQuestionDto, user: IUserSession) {
    const { ticketId, subjectId, fileId, title, ...rest } = updateQuestionDto;
    const data = {
      ...rest,
      ...(title && { title: title as unknown as Prisma.JsonObject }),
      ...(ticketId && { ticket: { connect: { id: ticketId } } }),
      ...(subjectId && { subject: { connect: { id: subjectId } } }),
      ...(fileId && { file: { connect: { id: fileId } } }),
      updatedBy: user.id,
      updatedAt: new Date(),
    };
    return this.prisma.questions.update({ where: { id }, data, select: this.select });
  }

  remove(id: string, user: IUserSession) {
    return this.prisma.questions.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      },
      select: this.select,
    });
  }

  findBySubject(subjectId: string) {
    return this.prisma.questions.findMany({
      where: {
        subjectId,
        isDeleted: false,
      },
      select: {
        ...this.select,
        answers: {
          select: {
            id: true,
            title: true,
            isCorrect: true,
            createdAt: true,
            updatedAt: true,
          },
          where: { isDeleted: false },
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
        file: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });
  }

  findByTicket(ticketId: string) {
    return this.prisma.questions.findMany({
      where: {
        ticketId,
        isDeleted: false,
      },
      select: {
        ...this.select,
        answers: {
          select: {
            id: true,
            title: true,
            isCorrect: true,
            createdAt: true,
            updatedAt: true,
          },
          where: { isDeleted: false },
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
        file: {
          select: {
            id: true,
            name: true,
            path: true,
          },
        },
      },
    });
  }
}

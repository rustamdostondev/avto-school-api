import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAnswerDto } from '../dto/create-answer.dto';
import { UpdateAnswerDto } from '../dto/update-answer.dto';
import { AnswerListDto } from '../dto/answer-list.dto';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { IApiResponse } from '@common/interfaces/api-response.interface';
import { CustomApiResponse } from '@common/utils/api-response.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class AnswersService {
  constructor(private readonly prisma: PrismaService) {}

  select = {
    id: true,
    title: true,
    isCorrect: true,
    createdAt: true,
    updatedAt: true,
  };

  async findAll(payload: AnswerListDto): Promise<IApiResponse<unknown[]>> {
    const { limit, page, search, sortBy, order, questionId, isCorrect } = payload;

    const select = {
      id: true,
      title: true,
      isCorrect: true,
      createdAt: true,
      updatedAt: true,
      question: {
        select: {
          id: true,
          title: true,
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
        },
      },
    };

    // Build the search condition
    const where: Prisma.AnswersWhereInput = { isDeleted: false };

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

    if (questionId) {
      where.questionId = questionId;
    }

    if (typeof isCorrect === 'boolean') {
      where.isCorrect = isCorrect;
    }

    const sort =
      Object.keys(select).includes(sortBy) && sortBy ? { [sortBy]: order } : { createdAt: order };

    // Fetch paginated answers
    const [results, total] = await Promise.all([
      this.prisma.answers.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select,
        orderBy: sort,
      }),
      this.prisma.answers.count({ where }),
    ]);

    // Return the paginated response
    return CustomApiResponse.paginated(results, page, limit, total);
  }

  create(createAnswerDto: CreateAnswerDto, user: IUserSession) {
    return this.prisma.answers.create({
      data: {
        ...createAnswerDto,
        title: createAnswerDto.title as unknown as Prisma.JsonObject,
        createdBy: user.id,
      },
      select: this.select,
    });
  }

  findOne(id: string) {
    return this.prisma.answers.findFirst({
      where: { id, isDeleted: false },
      include: {
        ...this.select,
        question: {
          include: {
            subject: true,
            ticket: true,
          },
        },
      },
    });
  }

  update(id: string, updateAnswerDto: UpdateAnswerDto, user: IUserSession) {
    return this.prisma.answers.update({
      where: { id },
      data: {
        ...updateAnswerDto,
        ...(updateAnswerDto.title && {
          title: updateAnswerDto.title as unknown as Prisma.JsonObject,
        }),
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });
  }

  remove(id: string, user: IUserSession) {
    return this.prisma.answers.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });
  }

  findByQuestion(questionId: string) {
    return this.prisma.answers.findMany({
      where: {
        questionId,
        isDeleted: false,
      },
      include: {
        ...this.select,
        question: {
          include: {
            subject: true,
            ticket: true,
          },
        },
      },
    });
  }
}

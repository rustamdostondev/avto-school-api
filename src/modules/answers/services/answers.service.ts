import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateAnswerDto } from '../dto/create-answer.dto';
import { CreateMultipleAnswersDto } from '../dto/create-multiple-answers.dto';
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

  async create(createAnswerDto: CreateAnswerDto, user: IUserSession) {
    // If this answer is marked as correct, check if question already has a correct answer
    if (createAnswerDto.isCorrect === true) {
      const existingCorrectAnswer = await this.prisma.answers.findFirst({
        where: {
          questionId: createAnswerDto.questionId,
          isCorrect: true,
          isDeleted: false,
        },
      });

      if (existingCorrectAnswer) {
        throw new BadRequestException('This question already has a correct answer. Please update existing answers instead.');
      }
    }

    return this.prisma.answers.create({
      data: {
        ...createAnswerDto,
        title: createAnswerDto.title as unknown as Prisma.JsonObject,
        createdBy: user.id,
      },
      select: this.select,
    });
  }

  async createMultiple(createMultipleAnswersDto: CreateMultipleAnswersDto, user: IUserSession) {
    const { questionId, answers } = createMultipleAnswersDto;

    // Validate that only one answer is marked as correct
    const correctAnswers = answers.filter(answer => answer.isCorrect === true);
    if (correctAnswers.length > 1) {
      throw new BadRequestException('Only one answer can be marked as correct per question');
    }
    if (correctAnswers.length === 0) {
      throw new BadRequestException('At least one answer must be marked as correct');
    }

    // Check if question already has a correct answer
    const existingCorrectAnswer = await this.prisma.answers.findFirst({
      where: {
        questionId,
        isCorrect: true,
        isDeleted: false,
      },
    });

    if (existingCorrectAnswer) {
      throw new BadRequestException('This question already has a correct answer. Please update existing answers instead.');
    }

    // Prepare data for bulk creation - all answers will have the same questionId
    const answersData = answers.map((answer) => ({
      questionId,
      title: answer.title as unknown as Prisma.JsonObject,
      isCorrect: answer.isCorrect,
      createdBy: user.id,
    }));

    // Use transaction to ensure all answers are created or none
    const createdAnswers = await this.prisma.$transaction(
      answersData.map((answerData) =>
        this.prisma.answers.create({
          data: answerData,
          select: this.select,
        }),
      ),
    );

    return createdAnswers;
  }

  findOne(id: string) {
    return this.prisma.answers.findFirst({
      where: { id, isDeleted: false },
      select: {
        ...this.select,
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
      },
    });
  }

  async update(id: string, updateAnswerDto: UpdateAnswerDto, user: IUserSession) {
    // If updating to correct answer, check if question already has another correct answer
    if (updateAnswerDto.isCorrect === true) {
      // First get the current answer to know its questionId
      const currentAnswer = await this.prisma.answers.findUnique({
        where: { id },
        select: { questionId: true },
      });

      if (!currentAnswer) {
        throw new BadRequestException('Answer not found');
      }

      // Check if there's already a correct answer for this question (excluding current answer)
      const existingCorrectAnswer = await this.prisma.answers.findFirst({
        where: {
          questionId: currentAnswer.questionId,
          isCorrect: true,
          isDeleted: false,
          id: { not: id }, // Exclude current answer
        },
      });

      if (existingCorrectAnswer) {
        throw new BadRequestException('This question already has a correct answer. Please update that answer to incorrect first.');
      }
    }

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
      select: {
        ...this.select,
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
      },
    });
  }
}

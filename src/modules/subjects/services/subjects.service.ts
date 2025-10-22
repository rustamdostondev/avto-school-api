import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { SubjectListDto } from '../dto/subject-list.dto';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { IApiResponse } from '@common/interfaces/api-response.interface';
import { CustomApiResponse } from '@common/utils/api-response.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}
  select = {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
  };
  async findAll(payload: SubjectListDto): Promise<IApiResponse<unknown[]>> {
    const { limit, page, search, sortBy, order } = payload;

    // Build the search condition
    const where: Prisma.SubjectsWhereInput = search
      ? {
          OR: [
            {
              name: {
                path: ['oz'],
                string_contains: search,
              } as Prisma.JsonFilter,
            },
            {
              name: {
                path: ['uz'],
                string_contains: search,
              } as Prisma.JsonFilter,
            },
            {
              name: {
                path: ['ru'],
                string_contains: search,
              } as Prisma.JsonFilter,
            },
          ],
        }
      : {};

    const sort =
      Object.keys(this.select).includes(sortBy) && sortBy
        ? { [sortBy]: order }
        : { createdAt: order };

    // Fetch paginated subjects
    const [results, total] = await Promise.all([
      this.prisma.subjects.findMany({
        take: limit,
        skip: limit * (page - 1),
        where: { ...where, isDeleted: false },
        select: this.select,
        orderBy: sort,
      }),
      this.prisma.subjects.count({ where: { ...where, isDeleted: false } }),
    ]);

    // Return the paginated response
    return CustomApiResponse.paginated(results, page, limit, total);
  }

  create(createSubjectDto: CreateSubjectDto, user: IUserSession) {
    return this.prisma.subjects.create({
      data: {
        name: createSubjectDto.name as unknown as Prisma.JsonObject,
        createdBy: user.id,
      },
      select: this.select,
    });
  }

  findOne(id: string) {
    return this.prisma.subjects.findFirst({
      where: { id, isDeleted: false },
      include: {
        questions: {
          where: { isDeleted: false },
          select: {
            id: true,
            title: true,
            createdAt: true,
          },
        },
      },
    });
  }

  update(id: string, updateSubjectDto: UpdateSubjectDto, user: IUserSession) {
    return this.prisma.subjects.update({
      where: { id },
      data: {
        ...(updateSubjectDto.name && {
          name: updateSubjectDto.name as unknown as Prisma.JsonObject,
        }),
        updatedBy: user.id,
        updatedAt: new Date(),
      },
      select: this.select,
    });
  }

  remove(id: string, user: IUserSession) {
    return this.prisma.subjects.update({
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

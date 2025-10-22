import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDto } from '../dto/update-ticket.dto';
import { TicketListDto } from '../dto/ticket-list.dto';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { IApiResponse } from '@common/interfaces/api-response.interface';
import { CustomApiResponse } from '@common/utils/api-response.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  select = {
    id: true,
    name: true,
    createdAt: true,
    updatedAt: true,
  };
  async findAll(payload: TicketListDto): Promise<IApiResponse<unknown[]>> {
    const { limit, page, search, sortBy, order } = payload;

    const select = {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          questions: {
            where: { isDeleted: false },
          },
        },
      },
    };

    // Build the search condition
    const where: Prisma.TicketsWhereInput = search
      ? {
          name: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        }
      : {};

    const sort =
      Object.keys(select).includes(sortBy) && sortBy ? { [sortBy]: order } : { createdAt: order };

    // Fetch paginated tickets
    const [results, total] = await Promise.all([
      this.prisma.tickets.findMany({
        take: limit,
        skip: limit * (page - 1),
        where: { ...where, isDeleted: false },
        select,
        orderBy: sort,
      }),
      this.prisma.tickets.count({ where: { ...where, isDeleted: false } }),
    ]);

    // Return the paginated response
    return CustomApiResponse.paginated(results, page, limit, total);
  }

  create(createTicketDto: CreateTicketDto, user: IUserSession) {
    return this.prisma.tickets.create({
      data: {
        ...createTicketDto,
        createdBy: user.id,
      },
      select: this.select,
    });
  }

  findOne(id: string) {
    return this.prisma.tickets.findFirst({
      where: { id, isDeleted: false },
      include: {
        ...this.select,
        questions: {
          where: { isDeleted: false },
          include: {
            answers: {
              where: { isDeleted: false },
            },
            subject: {
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

  update(id: string, updateTicketDto: UpdateTicketDto, user: IUserSession) {
    return this.prisma.tickets.update({
      where: { id },
      data: {
        ...updateTicketDto,
        updatedBy: user.id,
        updatedAt: new Date(),
      },
      select: this.select,
    });
  }

  remove(id: string, user: IUserSession) {
    return this.prisma.tickets.update({
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

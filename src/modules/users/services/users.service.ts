import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { ICreateUserDto, IUpdateUserDto } from '../interfaces/user.interface';
import { IPagination } from '@common/interfaces/pagination.interface';
import { CustomApiResponse } from '@common/utils/api-response.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(payload: IPagination) {
    const { limit, page, search, sortBy, order } = payload;

    const select = {
      id: true,
      fullName: true,
      email: true,
    };

    // Build the search condition
    const where = search
      ? {
          isDeleted: false,
          OR: [
            { fullName: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const sort = Object.keys(select).includes(sortBy) && sortBy ? { [sortBy]: order } : {};

    // Fetch paginated users
    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select,
        orderBy: sort,
      }),
      this.prisma.users.count({ where }),
    ]);

    // Return the paginated response
    return CustomApiResponse.paginated(users, page, limit, total);
  }

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isVerified: true,
        createdAt: true,
        userRoles: {
          select: {
            roles: {
              select: {
                id: true,
                name: true,
                description: true,
                rolePermissions: {
                  select: {
                    permissions: {
                      select: {
                        id: true,
                        name: true,
                        action: true,
                        resource: true,
                        description: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const roles = user.userRoles.map(({ roles }) => ({
      id: roles.id,
      name: roles.name,
      description: roles.description,
    }));

    const permissions = user.userRoles
      .flatMap(({ roles }) => roles.rolePermissions)
      .flatMap(({ permissions }) => permissions);

    delete user.userRoles;
    return {
      ...user,
      roles,
      permissions,
    };
  }

  async create(data: ICreateUserDto) {
    // Check email uniqueness
    const existingUser = await this.prisma.users.findFirst({
      where: { email: data.email, isDeleted: false },
    });

    if (existingUser) {
      throw new BadRequestException('email already exists');
    }

    const user = await this.prisma.users.create({
      data: {
        ...data,
      },
    });
    return user;
  }

  async update(id: string, data: IUpdateUserDto, createUser: IUserSession) {
    // Check if user exists
    const existingUser = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check email uniqueness if email is being updated
    if (data.email) {
      const emailUser = await this.prisma.users.findUnique({
        where: { email: data.email, isDeleted: false },
      });

      if (emailUser && emailUser.id !== id) {
        throw new BadRequestException('Email already exists');
      }
    }

    const user = await this.prisma.users.update({
      where: { id, isDeleted: false },
      data: {
        ...data,
        updatedAt: new Date(),
        updatedBy: createUser.id,
      },
    });
    return user;
  }

  async delete(id: string, user: IUserSession): Promise<{ message: string }> {
    // Check if user exists
    const exists = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
    });
    if (!exists) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.prisma.users.update({
      where: { id, isDeleted: false },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: user.id,
      },
    });
    return { message: 'User deleted successfully' };
  }
}

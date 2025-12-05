import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as moment from 'moment';
import { ICreateUserDto, IUpdateUserDto } from '../interfaces/user.interface';
import { IPagination } from '@common/interfaces/pagination.interface';
import { CustomApiResponse } from '@common/utils/api-response.util';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import {
  SetUserAccessPeriodDto,
  UpdateUserAccessPeriodDto,
  UserAccessStatusDto,
} from '../dto/user-access.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  select: Prisma.UsersSelect = {
    id: true,
    fullName: true,
    email: true,
    role: true,
    isVerified: true,
    createdAt: true,
    accessStartAt: true,
    accessEndAt: true,
  };

  async findAll(payload: IPagination) {
    const { limit, page, search, sortBy, order } = payload;

    const select: Prisma.UsersSelect = this.select;

    // Build the search condition
    const where = search
      ? {
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
        where: { isDeleted: false, ...where },
        select,
        orderBy: sort,
      }),
      this.prisma.users.count({ where: { isDeleted: false, ...where } }),
    ]);

    // Return the paginated response
    return CustomApiResponse.paginated(users, page, limit, total);
  }

  async findById(id: string) {
    const user = await this.prisma.users.findUnique({
      where: { id, isDeleted: false },
      select: this.select,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // const roles = user.userRoles.map(({ roles }) => ({
    //   id: roles.id,
    //   name: roles.name,
    //   description: roles.description,
    // }));

    // const permissions = user.userRoles
    //   .flatMap(({ roles }) => roles.rolePermissions)
    //   .flatMap(({ permissions }) => permissions);

    return user;
  }

  async create(data: ICreateUserDto) {
    // Check email uniqueness
    const existingUser = await this.prisma.users.findFirst({
      where: { email: data.email, isDeleted: false },
    });

    if (existingUser) {
      throw new BadRequestException('email already exists');
    }

    // Hash password if provided
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    const startDate = data.accessStartAt ? moment(data.accessStartAt).toDate() : moment().toDate();
    const endDate = data.accessEndAt
      ? moment(data.accessEndAt).toDate()
      : moment(startDate).add(1, 'month').toDate();

    if (data.accessStartAt && data.accessEndAt) {
      if (startDate >= endDate) {
        throw new BadRequestException('Access start date must be before end date');
      }
    }

    const user = await this.prisma.users.create({
      data: {
        ...data,
        password: hashedPassword,
        plainPassword: data.password, // Store plain password for admin access
        isVerified: true,
        accessStartAt: startDate,
        accessEndAt: endDate,
      },
      select: this.select,
    });
    return user;
  }

  async update(id: string, data: IUpdateUserDto, createUser: IUserSession) {
    return createUser;
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

    // Hash password if provided
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 10) : undefined;

    // Prepare update data
    const updateData: Prisma.UsersUpdateInput = {
      ...data,
      updatedAt: moment().toDate(),
      updatedBy: createUser.id,
    };

    // Only include password if it was provided
    if (hashedPassword) {
      updateData.password = hashedPassword;
      updateData.plainPassword = data.password; // Store plain password for admin access
    } else {
      delete updateData.password;
      delete updateData.plainPassword;
    }
    if (data.accessStartAt || data.accessEndAt) {
      const startDate = moment(data.accessStartAt || existingUser.accessStartAt).toDate();
      const endDate = moment(data.accessEndAt || existingUser.accessEndAt).toDate();

      if (startDate >= endDate) {
        throw new BadRequestException('Access start date must be before end date');
      }

      updateData.accessStartAt = startDate;
      updateData.accessEndAt = endDate;
    }

    const user = await this.prisma.users.update({
      where: { id, isDeleted: false },
      data: updateData,
      select: this.select,
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
        email: exists.email + moment().format('YYYYMMDDHHmmss'),
        isDeleted: true,
        deletedAt: moment().toDate(),
        deletedBy: user.id,
      },
    });
    return { message: 'User deleted successfully' };
  }

  async setUserAccessPeriod(data: SetUserAccessPeriodDto, admin: IUserSession) {
    const user = await this.prisma.users.findUnique({
      where: { id: data.userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${data.userId} not found`);
    }

    if (data.accessStartAt || data.accessEndAt) {
      const startDate = moment(data.accessStartAt || user.accessStartAt).toDate();
      const endDate = moment(data.accessEndAt || user.accessEndAt).toDate();

      if (startDate >= endDate) {
        throw new BadRequestException('Access start date must be before end date');
      }
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: data.userId },
      data: {
        accessStartAt: data.accessStartAt ? moment(data.accessStartAt).toDate() : undefined,
        accessEndAt: data.accessEndAt ? moment(data.accessEndAt).toDate() : undefined,
        updatedBy: admin.id,
        updatedAt: moment().toDate(),
      },
      select: this.select,
    });

    return updatedUser;
  }

  async updateUserAccessPeriod(
    userId: string,
    data: UpdateUserAccessPeriodDto,
    admin: IUserSession,
  ) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const startDate = data.accessStartAt ? moment(data.accessStartAt).toDate() : user.accessStartAt;
    const endDate = data.accessEndAt ? moment(data.accessEndAt).toDate() : user.accessEndAt;

    if (startDate && endDate && startDate >= endDate) {
      throw new BadRequestException('Access start date must be before end date');
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: {
        ...(data.accessStartAt && { accessStartAt: moment(data.accessStartAt).toDate() }),
        ...(data.accessEndAt && { accessEndAt: moment(data.accessEndAt).toDate() }),
        updatedBy: admin.id,
        updatedAt: moment().toDate(),
      },
      select: this.select,
    });

    return updatedUser;
  }

  async checkUserAccess(userId: string): Promise<UserAccessStatusDto> {
    const user = await this.prisma.users.findUnique({
      where: { id: userId, isDeleted: false },
      select: this.select,
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const currentTime = moment().toDate();
    const { accessStartAt, accessEndAt } = user;

    if (!accessStartAt && !accessEndAt) {
      return {
        hasAccess: true,
        accessStartAt: null,
        accessEndAt: null,
        currentTime,
        message: 'No access restrictions set',
      };
    }

    const hasStartAccess = !accessStartAt || currentTime >= accessStartAt;
    const hasEndAccess = !accessEndAt || currentTime <= accessEndAt;
    const hasAccess = hasStartAccess && hasEndAccess;

    let message = '';
    let daysRemaining: number | undefined;

    if (!hasStartAccess) {
      const daysUntilStart = moment(accessStartAt).diff(moment(currentTime), 'days');
      message = `Access will start in ${daysUntilStart} days`;
    } else if (!hasEndAccess) {
      message = 'Access period has expired';
    } else if (accessEndAt) {
      daysRemaining = moment(accessEndAt).diff(moment(currentTime), 'days');
      message =
        daysRemaining > 0 ? `Access expires in ${daysRemaining} days` : 'Access expires today';
    } else {
      message = 'Access is valid';
    }

    return {
      hasAccess,
      accessStartAt,
      accessEndAt,
      currentTime,
      message,
      daysRemaining,
    };
  }

  async getAllUsersWithAccessPeriods(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.users.findMany({
        where: { isDeleted: false },
        select: this.select,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.users.count({
        where: { isDeleted: false },
      }),
    ]);

    const currentTime = moment().toDate();
    const usersWithAccessStatus = users.map((user) => {
      const hasStartAccess = !user.accessStartAt || currentTime >= user.accessStartAt;
      const hasEndAccess = !user.accessEndAt || currentTime <= user.accessEndAt;
      const hasAccess = hasStartAccess && hasEndAccess;

      let accessStatus = 'No restrictions';
      if (!hasStartAccess) {
        accessStatus = 'Not started';
      } else if (!hasEndAccess) {
        accessStatus = 'Expired';
      } else if (user.accessEndAt) {
        const daysRemaining = moment(user.accessEndAt).diff(moment(currentTime), 'days');
        accessStatus = `${daysRemaining} days remaining`;
      } else {
        accessStatus = 'Active';
      }

      return {
        ...user,
        hasAccess,
        accessStatus,
      };
    });

    return CustomApiResponse.paginated(usersWithAccessStatus, page, limit, total);
  }

  async removeUserAccessPeriod(userId: string, admin: IUserSession) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const updatedUser = await this.prisma.users.update({
      where: { id: userId },
      data: {
        accessStartAt: null,
        accessEndAt: null,
        updatedBy: admin.id,
        updatedAt: moment().toDate(),
      },
      select: this.select,
    });

    return updatedUser;
  }

  async getUserPassword(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId, isDeleted: false },
      select: {
        ...this.select,
        plainPassword: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      ...user,
      plainPassword: user.plainPassword || 'Password not available',
    };
  }
}

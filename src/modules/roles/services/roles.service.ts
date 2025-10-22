import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ICreateRoleDto, IPermission, IRole, IUpdateRoleDto } from '../interfaces/role.interface';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { CustomApiResponse } from 'src/common/utils/api-response.util';
import { IApiResponse } from '@common/interfaces/api-response.interface';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { AssignPermissionDto } from '../dto/assign-permission-to-user.dto copy';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationDto } from '@common/dto/pagination.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: ICreateRoleDto, user: IUserSession): Promise<IRole> {
    const existingRole = await this.prisma.roles.findUnique({
      where: {
        name: dto.name,
        isDeleted: false,
      },
    });
    if (existingRole) {
      throw new ConflictException(`Role with name ${dto.name} already exists`);
    }

    const role = await this.prisma.roles.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    if (dto.permissions?.length) {
      await this.assignPermissionsToRole(role.id, dto.permissions, user);
    }

    return role;
  }

  async findAll(paginationDto: PaginationDto): Promise<IApiResponse<IRole[]>> {
    const { limit, page, search, sortBy, order } = paginationDto;

    const select = {
      id: true,
      name: true,
      description: true,
    };

    // Build the search condition
    const where = search
      ? {
          isDeleted: false,
          OR: [
            { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
            { description: { contains: search, mode: Prisma.QueryMode.insensitive } },
          ],
        }
      : {};

    const sort = Object.keys(select).includes(sortBy) && sortBy ? { [sortBy]: order } : {};

    // Fetch paginated roles
    const [roles, total] = await Promise.all([
      this.prisma.roles.findMany({
        take: limit,
        skip: limit * (page - 1),
        where,
        select,
        orderBy: sort,
      }),
      this.prisma.roles.count({ where }),
    ]);

    // Return the paginated response
    return CustomApiResponse.paginated(roles, page, limit, total);
  }

  async findById(id: string): Promise<IRole> {
    const role = await this.prisma.roles.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(id: string, dto: IUpdateRoleDto, user: IUserSession): Promise<IRole> {
    const existingRole = await this.prisma.roles.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    const role = await this.prisma.roles.update({
      where: {
        id,
      },
      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    if (dto.permissions !== undefined) {
      await this.assignPermissionsToRole(id, dto.permissions, user);
    }

    return role;
  }

  async remove(id: string, user: IUserSession): Promise<null> {
    const existingRole = await this.prisma.roles.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!existingRole) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    await this.prisma.roles.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: user.id,
      },
    });

    return null;
  }

  private assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    user: IUserSession,
  ): Promise<void> {
    return this.prisma.$transaction(async (trx: PrismaService) => {
      await trx.rolePermissions.updateMany({
        where: { roleId, isDeleted: false },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: user.id,
        },
      });

      if (permissionIds.length > 0) {
        const rolePermissions = permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await trx.rolePermissions.createMany({
          data: rolePermissions,
        });
      }
    });
  }

  async assignRolesToUser(assignRoleDto: AssignRoleDto, user: IUserSession): Promise<null> {
    const { userId, roleIds } = assignRoleDto;

    // First validate all roles exist
    const roles = await this.prisma.roles.findMany({
      where: {
        id: { in: roleIds },
        isDeleted: false,
      },
    });
    if (roles.length !== roleIds.length) {
      const notFoundRoleIds = roleIds.filter((roleId) => !roles.some((role) => role.id === roleId));
      throw new NotFoundException(`Roles with IDs ${notFoundRoleIds.join(', ')} not found`);
    }

    return this.prisma.$transaction(async (trx: PrismaService) => {
      // Clear existing roles and assign new ones
      await trx.userRoles.updateMany({
        where: {
          userId,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: user.id,
        },
      });

      const userRoles = [];
      for (const roleId of roleIds) {
        const userRole = {
          user_id: userId,
          role_id: roleId,
          created_at: new Date(),
          updated_at: new Date(),
        };
        userRoles.push(userRole);
      }

      await trx.userRoles.createMany({
        data: userRoles,
      });

      return null;
    });
  }

  async getUserRoles(userId: string): Promise<IRole[]> {
    const roles = await this.prisma.roles.findMany({
      where: {
        userRoles: {
          some: {
            userId,
            isDeleted: false,
          },
        },
        isDeleted: false,
      },
      orderBy: {
        id: 'asc',
      },
    });
    return roles;
  }

  async getUserPermissions(userId: string): Promise<IPermission[]> {
    // Get permissions from user's roles
    const rolePermissions = await this.prisma.permissions.findMany({
      where: {
        isDeleted: false,
        rolePermissions: {
          some: {
            isDeleted: false,
            roles: {
              userRoles: {
                some: {
                  userId,
                  isDeleted: false,
                },
              },
            },
          },
        },
      },
    });

    // Get user-specific permissions
    const userPermissions = await this.prisma.permissions.findMany({
      where: {
        isDeleted: false,
        userPermissions: {
          some: {
            userId,
            isDeleted: false,
          },
        },
      },
    });

    // Combine and remove duplicates
    const allPermissions = [...rolePermissions, ...userPermissions];
    const uniquePermissions = allPermissions.filter(
      (permission, index, self) => index === self.findIndex((p) => p.id === permission.id),
    );

    return uniquePermissions;
  }

  async userHasPermissions(userId: string, permissions: string[]): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    const permissionSet = new Set(userPermissions.map((p) => `${p.resource}:${p.action}`));

    return permissions.every((permission) => permissionSet.has(permission));
  }

  async assignPermissionToUser(
    { userId, permissionIds }: AssignPermissionDto,
    user: IUserSession,
  ): Promise<void> {
    const existingPermissions = await this.getUserPermissions(userId);

    // Extract existing permission IDs
    const existingPermissionIds = existingPermissions.map((record) => record.id);

    // Filter out already assigned permissions
    const newPermissionIds = permissionIds.filter((id) => !existingPermissionIds.includes(id));

    // Insert new permissions if any
    if (newPermissionIds.length > 0) {
      const insertData = newPermissionIds.map((permissionId) => ({
        userId,
        permissionId,
        createdBy: user.id,
      }));

      await this.prisma.userPermissions.createMany({
        data: insertData,
      });
    }
  }

  async listRolesWithPermissions(roleId: string): Promise<IRole> {
    const rolesWithPermissions = await this.prisma.roles.findFirst({
      where: { isDeleted: false, id: roleId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        rolePermissions: {
          where: { isDeleted: false },
          select: {
            permissions: {
              select: {
                id: true,
                name: true,
                action: true,
                resource: true,
                description: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const permissions = rolesWithPermissions.rolePermissions.flatMap(
      ({ permissions }) => permissions,
    );

    delete rolesWithPermissions.rolePermissions;
    return {
      ...rolesWithPermissions,
      permissions,
    };
  }
}

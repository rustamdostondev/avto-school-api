import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AssignRoleDto } from '../dto/assign-role.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RolesService } from '../services/roles.service';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { AssignPermissionDto } from '../dto/assign-permission-to-user.dto copy';
import { PaginationDto } from '@common/dto/pagination.dto';
import { PERMISSIONS, RESOURCES } from '@common/constants';

@ApiTags('Roles')
@ApiBearerAuth('authorization')
@UseGuards(JwtAuthGuard, AuthGuard)
@Controller({
  path: RESOURCES.ROLES,
  version: '1',
})
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.CREATE}`)
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  create(@Body() createRoleDto: CreateRoleDto, @User() user: IUserSession) {
    return this.rolesService.create(createRoleDto, user);
  }

  @Get()
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.READ}`)
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of all roles' })
  findAll(@Query() paginationDto: PaginationDto) {
    return this.rolesService.findAll(paginationDto);
  }

  @Get(':id')
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.READ}`)
  @ApiOperation({ summary: 'Get a role by ID' })
  @ApiResponse({ status: 200, description: 'Role details' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findById(id);
  }

  @Patch(':id')
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.UPDATE}`)
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  update(
    @Param('id', ParseIntPipe) id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @User() user: IUserSession,
  ) {
    return this.rolesService.update(id, updateRoleDto, user);
  }

  @Delete(':id')
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.DELETE}`)
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  remove(@Param('id') id: string, @User() user: IUserSession) {
    return this.rolesService.remove(id, user);
  }

  @Post('assign')
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.ASSIGN}`)
  @ApiOperation({ summary: 'Assign roles to a user' })
  @ApiResponse({ status: 200, description: 'Roles assigned successfully' })
  assignRoles(@Body() assignRoleDto: AssignRoleDto, @User() user: IUserSession) {
    return this.rolesService.assignRolesToUser(assignRoleDto, user);
  }

  @Post('assign-permissions')
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.ASSIGN}`)
  @ApiOperation({ summary: 'Assign permissions to a user' })
  @ApiResponse({ status: 200, description: 'Permissions assigned successfully' })
  assignPermissionToUser(
    @Body() assignPermissionDto: AssignPermissionDto,
    @User() user: IUserSession,
  ) {
    return this.rolesService.assignPermissionToUser(assignPermissionDto, user);
  }

  @Get(':id/permissions')
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.READ}`)
  @ApiOperation({ summary: 'Get permissions of a role' })
  @ApiResponse({ status: 200, description: 'List of role permissions' })
  listRolesWithPermissions(@Param('id') id: string) {
    return this.rolesService.listRolesWithPermissions(id);
  }

  @Get('user/:userId/roles')
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.READ}`)
  @ApiOperation({ summary: 'Get roles of a user' })
  @ApiResponse({ status: 200, description: 'List of user roles' })
  getUserRoles(@Param('userId') userId: string) {
    return this.rolesService.getUserRoles(userId);
  }

  @Get('user/:userId/permissions')
  @RequirePermissions(`${RESOURCES.ROLES}:${PERMISSIONS.READ}`)
  @ApiOperation({ summary: 'Get permissions of a user' })
  @ApiResponse({ status: 200, description: 'List of user permissions' })
  getUserPermissions(@Param('userId') userId: string) {
    return this.rolesService.getUserPermissions(userId);
  }
}

import { AuthGuard } from 'src/guards/auth.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { PaginationDto } from '@common/dto/pagination.dto';
import { User } from '@common/decorators/user.decorator';
import { IUser } from '../interfaces/user.interface';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { PERMISSIONS, RESOURCES } from '@common/constants';
import { RequirePermissions } from '@common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, AuthGuard)
@ApiBearerAuth('authorization')
@ApiTags('Users')
@Controller({
  path: RESOURCES.USERS,
  version: '1',
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  findAll(@Query() paginationDto: PaginationDto) {
    return this.usersService.findAll(paginationDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  getProfile(@User() user: IUser) {
    return this.usersService.findById(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.CREATE}`)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.UPDATE}`)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() user: IUserSession,
  ) {
    return this.usersService.update(id, updateUserDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.DELETE}`)
  remove(@Param('id') id: string, @User() user: IUserSession) {
    return this.usersService.delete(id, user);
  }

  @Get(':id/password')
  @ApiOperation({ summary: 'Get user password (Admin only)' })
  getUserPassword(@Param('id') userId: string) {
    return this.usersService.getUserPassword(userId);
  }

  // Access Period Management Endpoints
  // @Post('access-period')
  // @ApiOperation({ summary: 'Set user access period (Admin only)' })
  // @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.UPDATE}`)
  // setUserAccessPeriod(
  //   @Body() setAccessPeriodDto: SetUserAccessPeriodDto,
  //   @User() admin: IUserSession,
  // ) {
  //   return this.usersService.setUserAccessPeriod(setAccessPeriodDto, admin);
  // }

  // @Put(':id/access-period')
  // @ApiOperation({ summary: 'Update user access period (Admin only)' })
  // @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.UPDATE}`)
  // updateUserAccessPeriod(
  //   @Param('id') userId: string,
  //   @Body() updateAccessPeriodDto: UpdateUserAccessPeriodDto,
  //   @User() admin: IUserSession,
  // ) {
  //   return this.usersService.updateUserAccessPeriod(userId, updateAccessPeriodDto, admin);
  // }

  // @Get('me/access-status')
  // @ApiOperation({ summary: 'Check current user access status' })
  // @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  // checkMyAccess(@User() user: IUserSession) {
  //   return this.usersService.checkUserAccess(user.id);
  // }

  // @Get(':id/access-status')
  // @ApiOperation({ summary: 'Check user access status' })
  // @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  // checkUserAccess(@Param('id') userId: string) {
  //   return this.usersService.checkUserAccess(userId);
  // }

  // @Get('admin/access-periods')
  // @ApiOperation({ summary: 'Get all users with access periods (Admin only)' })
  // @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  // getAllUsersWithAccessPeriods(@Query() paginationDto: PaginationDto) {
  //   return this.usersService.getAllUsersWithAccessPeriods(paginationDto.page, paginationDto.limit);
  // }

  // @Delete(':id/access-period')
  // @ApiOperation({ summary: 'Remove user access period restrictions (Admin only)' })
  // @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.UPDATE}`)
  // removeUserAccessPeriod(@Param('id') userId: string, @User() admin: IUserSession) {
  //   return this.usersService.removeUserAccessPeriod(userId, admin);
  // }
}

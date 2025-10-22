import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { SubjectsService } from '../services/subjects.service';
import { CreateSubjectDto } from '../dto/create-subject.dto';
import { UpdateSubjectDto } from '../dto/update-subject.dto';
import { SubjectListDto } from '../dto/subject-list.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { RESOURCES, PERMISSIONS } from '@common/constants';

@UseGuards(JwtAuthGuard, AuthGuard)
@ApiBearerAuth('authorization')
@ApiTags('Subjects')
@Controller({
  path: RESOURCES.SUBJECTS,
  version: '1',
})
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  @RequirePermissions(`${RESOURCES.SUBJECTS}:${PERMISSIONS.READ}`)
  findAll(@Query() listDto: SubjectListDto) {
    return this.subjectsService.findAll(listDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new subject' })
  @RequirePermissions(`${RESOURCES.SUBJECTS}:${PERMISSIONS.CREATE}`)
  create(@Body() createSubjectDto: CreateSubjectDto, @User() user: IUserSession) {
    return this.subjectsService.create(createSubjectDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subject by ID' })
  @RequirePermissions(`${RESOURCES.SUBJECTS}:${PERMISSIONS.READ}`)
  findOne(@Param('id') id: string) {
    return this.subjectsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update subject by ID' })
  @RequirePermissions(`${RESOURCES.SUBJECTS}:${PERMISSIONS.UPDATE}`)
  update(
    @Param('id') id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
    @User() user: IUserSession,
  ) {
    return this.subjectsService.update(id, updateSubjectDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete subject by ID' })
  @RequirePermissions(`${RESOURCES.SUBJECTS}:${PERMISSIONS.DELETE}`)
  remove(@Param('id') id: string, @User() user: IUserSession) {
    return this.subjectsService.remove(id, user);
  }
}

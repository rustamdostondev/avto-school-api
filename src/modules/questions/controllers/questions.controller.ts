import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { QuestionsService } from '../services/questions.service';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { UpdateQuestionDto } from '../dto/update-question.dto';
import { QuestionListDto } from '../dto/question-list.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { RESOURCES, PERMISSIONS } from '@common/constants';

@UseGuards(JwtAuthGuard, AuthGuard)
@ApiBearerAuth('authorization')
@ApiTags('Questions')
@Controller({
  path: RESOURCES.QUESTIONS,
  version: '1',
})
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all questions' })
  @RequirePermissions(`${RESOURCES.QUESTIONS}:${PERMISSIONS.READ}`)
  findAll(@Query() listDto: QuestionListDto) {
    return this.questionsService.findAll(listDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new question' })
  @RequirePermissions(`${RESOURCES.QUESTIONS}:${PERMISSIONS.CREATE}`)
  create(@Body() createQuestionDto: CreateQuestionDto, @User() user: IUserSession) {
    return this.questionsService.create(createQuestionDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get question by ID' })
  @RequirePermissions(`${RESOURCES.QUESTIONS}:${PERMISSIONS.READ}`)
  findOne(@Param('id') id: string) {
    return this.questionsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update question by ID' })
  @RequirePermissions(`${RESOURCES.QUESTIONS}:${PERMISSIONS.UPDATE}`)
  update(
    @Param('id') id: string,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @User() user: IUserSession,
  ) {
    return this.questionsService.update(id, updateQuestionDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete question by ID' })
  @RequirePermissions(`${RESOURCES.QUESTIONS}:${PERMISSIONS.DELETE}`)
  remove(@Param('id') id: string, @User() user: IUserSession) {
    return this.questionsService.remove(id, user);
  }

  @Get('subject/:subjectId')
  @ApiOperation({ summary: 'Get questions by subject ID' })
  @RequirePermissions(`${RESOURCES.QUESTIONS}:${PERMISSIONS.READ}`)
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.questionsService.findBySubject(subjectId);
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Get questions by ticket ID' })
  @RequirePermissions(`${RESOURCES.QUESTIONS}:${PERMISSIONS.READ}`)
  findByTicket(@Param('ticketId') ticketId: string) {
    return this.questionsService.findByTicket(ticketId);
  }
}

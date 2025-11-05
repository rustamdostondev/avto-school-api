import { Controller, Get, Post, Body, Param, Delete, UseGuards, Query, Put } from '@nestjs/common';
import { AnswersService } from '../services/answers.service';
import { CreateAnswerDto } from '../dto/create-answer.dto';
import { CreateMultipleAnswersDto } from '../dto/create-multiple-answers.dto';
import { UpdateAnswerDto } from '../dto/update-answer.dto';
import { AnswerListDto } from '../dto/answer-list.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { RESOURCES, PERMISSIONS } from '@common/constants';

@UseGuards(JwtAuthGuard, AuthGuard)
@ApiBearerAuth('authorization')
@ApiTags('Answers')
@Controller({
  path: RESOURCES.ANSWERS,
  version: '1',
})
export class AnswersController {
  constructor(private readonly answersService: AnswersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all answers' })
  @RequirePermissions(`${RESOURCES.ANSWERS}:${PERMISSIONS.READ}`)
  findAll(@Query() listDto: AnswerListDto) {
    return this.answersService.findAll(listDto);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new answer' })
  @RequirePermissions(`${RESOURCES.ANSWERS}:${PERMISSIONS.CREATE}`)
  create(@Body() createAnswerDto: CreateAnswerDto, @User() user: IUserSession) {
    return this.answersService.create(createAnswerDto, user);
  }

  @Post('multiple')
  @ApiOperation({ summary: 'Create multiple answers for a single question' })
  @RequirePermissions(`${RESOURCES.ANSWERS}:${PERMISSIONS.CREATE}`)
  createMultiple(
    @Body() createMultipleAnswersDto: CreateMultipleAnswersDto,
    @User() user: IUserSession,
  ) {
    return this.answersService.createMultiple(createMultipleAnswersDto, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get answer by ID' })
  @RequirePermissions(`${RESOURCES.ANSWERS}:${PERMISSIONS.READ}`)
  findOne(@Param('id') id: string) {
    return this.answersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update answer by ID' })
  @RequirePermissions(`${RESOURCES.ANSWERS}:${PERMISSIONS.UPDATE}`)
  update(
    @Param('id') id: string,
    @Body() updateAnswerDto: UpdateAnswerDto,
    @User() user: IUserSession,
  ) {
    return this.answersService.update(id, updateAnswerDto, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete answer by ID' })
  @RequirePermissions(`${RESOURCES.ANSWERS}:${PERMISSIONS.DELETE}`)
  remove(@Param('id') id: string, @User() user: IUserSession) {
    return this.answersService.remove(id, user);
  }

  @Get('question/:questionId')
  @ApiOperation({ summary: 'Get answers by question ID' })
  @RequirePermissions(`${RESOURCES.ANSWERS}:${PERMISSIONS.READ}`)
  findByQuestion(@Param('questionId') questionId: string) {
    return this.answersService.findByQuestion(questionId);
  }
}

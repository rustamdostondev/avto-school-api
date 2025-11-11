import { Controller, Post, Body, UseGuards, Param, Get } from '@nestjs/common';
import { ExamsService } from '../services/exams.service';
import { StartExamDto } from '../dto/start-exam.dto';
import { SubmitAnswersDto } from '../dto/submit-answers.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { RESOURCES, PERMISSIONS } from '@common/constants';

@UseGuards(JwtAuthGuard, AuthGuard)
@ApiBearerAuth('authorization')
@ApiTags('Exams')
@Controller({
  path: 'exams',
  version: '1',
})
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start a new exam session' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  startExam(@Body() startExamDto: StartExamDto, @User() user: IUserSession) {
    return this.examsService.startExam(startExamDto, user);
  }

  @Post('submit/:sessionId')
  @ApiOperation({ summary: 'Submit exam answers' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  submitAnswers(
    @Param('sessionId') sessionId: string,
    @Body() submitDto: SubmitAnswersDto,
    @User() user: IUserSession,
  ) {
    return this.examsService.submitAnswers(sessionId, submitDto, user);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get exam statistics' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  getStatistics(@User() user: IUserSession) {
    return this.examsService.getExamStatistics(user);
  }
}

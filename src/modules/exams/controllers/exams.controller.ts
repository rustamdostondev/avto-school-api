import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ExamsService } from '../services/exams.service';
import { StartExamDto } from '../dto/start-exam.dto';
import { SubmitExamDto } from '../dto/submit-exam.dto';
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

  @Post(':sessionId/submit')
  @ApiOperation({ summary: 'Submit exam answers' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  submitExam(
    @Param('sessionId') sessionId: string,
    @Body() submitExamDto: SubmitExamDto,
    @User() user: IUserSession,
  ) {
    return this.examsService.submitExam(sessionId, submitExamDto, user);
  }

  @Post(':sessionId/finish')
  @ApiOperation({ summary: 'Finish exam without submitting answers' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  finishExam(@Param('sessionId') sessionId: string, @User() user: IUserSession) {
    return this.examsService.finishExam(sessionId, user);
  }

  @Get('session/:sessionId')
  @ApiOperation({ summary: 'Get exam session details' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  getExamSession(@Param('sessionId') sessionId: string, @User() user: IUserSession) {
    return this.examsService.getExamSession(sessionId, user);
  }

  @Get('active-session')
  @ApiOperation({ summary: 'Get user active exam session' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  getActiveSession(@User() user: IUserSession) {
    return this.examsService.getActiveSession(user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get user exam history' })
  @RequirePermissions(`${RESOURCES.USERS}:${PERMISSIONS.READ}`)
  getUserExamHistory(@User() user: IUserSession) {
    return this.examsService.getUserExamHistory(user);
  }

  @Get('results/:subjectId')
  @ApiOperation({ summary: 'Get exam results for a subject (Admin only)' })
  @RequirePermissions(`${RESOURCES.SUBJECTS}:${PERMISSIONS.READ}`)
  getSubjectExamResults(@Param('subjectId') subjectId: string) {
    return this.examsService.getSubjectExamResults(subjectId);
  }
}

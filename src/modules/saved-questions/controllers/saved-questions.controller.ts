import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { AuthGuard } from 'src/guards/auth.guard';
import { RequirePermissions } from '@common/decorators/permissions.decorator';
import { User } from '@common/decorators/user.decorator';
import { IUserSession } from '@modules/auth/interfaces/auth.interface';
import { RESOURCES, PERMISSIONS } from '@common/constants';
import { SavedQuestionsService } from '../services/saved-questions.service';
import { CreateSavedQuestionDto } from '../dto/create-saved-question.dto';
import { UpdateSavedQuestionDto } from '../dto/update-saved-question.dto';
import { FilterSavedQuestionsDto } from '../dto/filter-saved-questions.dto';

@UseGuards(JwtAuthGuard, AuthGuard)
@ApiBearerAuth('authorization')
@ApiTags('Saved Questions')
@Controller({
  path: RESOURCES.SAVED_QUESTIONS,
  version: '1',
})
export class SavedQuestionsController {
  constructor(private readonly savedQuestionsService: SavedQuestionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user saved questions list' })
  @RequirePermissions(`${RESOURCES.SAVED_QUESTIONS}:${PERMISSIONS.READ}`)
  findAll(@Query() query: FilterSavedQuestionsDto, @User() user: IUserSession) {
    return this.savedQuestionsService.findAll(query, user);
  }

  @Post()
  @ApiOperation({ summary: 'Save question for current user' })
  @RequirePermissions(`${RESOURCES.SAVED_QUESTIONS}:${PERMISSIONS.CREATE}`)
  create(@Body() payload: CreateSavedQuestionDto, @User() user: IUserSession) {
    return this.savedQuestionsService.create(payload, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get saved question detail' })
  @RequirePermissions(`${RESOURCES.SAVED_QUESTIONS}:${PERMISSIONS.READ}`)
  findOne(@Param('id') id: string, @User() user: IUserSession) {
    return this.savedQuestionsService.findOne(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update saved question status or note' })
  @RequirePermissions(`${RESOURCES.SAVED_QUESTIONS}:${PERMISSIONS.UPDATE}`)
  update(
    @Param('id') id: string,
    @Body() payload: UpdateSavedQuestionDto,
    @User() user: IUserSession,
  ) {
    return this.savedQuestionsService.update(id, payload, user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete saved question for user' })
  @RequirePermissions(`${RESOURCES.SAVED_QUESTIONS}:${PERMISSIONS.DELETE}`)
  remove(@Param('id') id: string, @User() user: IUserSession) {
    return this.savedQuestionsService.remove(id, user);
  }
}

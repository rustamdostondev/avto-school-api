import { PartialType } from '@nestjs/swagger';
import { CreateSavedQuestionDto } from './create-saved-question.dto';

export class UpdateSavedQuestionDto extends PartialType(CreateSavedQuestionDto) {}

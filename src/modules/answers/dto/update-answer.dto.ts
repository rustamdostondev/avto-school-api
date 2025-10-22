import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateAnswerDto } from './create-answer.dto';

export class UpdateAnswerDto extends PartialType(OmitType(CreateAnswerDto, ['questionId'])) {}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize, IsNotEmpty, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateAnswerItemDto } from './create-answer-item.dto';

export class CreateMultipleAnswersDto {
  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'Question ID to create answers for',
  })
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiProperty({
    type: [CreateAnswerItemDto],
    description: 'Array of answers to create for the question',
    example: [
      {
        isCorrect: true,
        title: {
          oz: 'Javob 1',
          uz: 'Жавоб 1',
          ru: 'Ответ 1',
        },
      },
      {
        isCorrect: false,
        title: {
          oz: 'Javob 2',
          uz: 'Жавоб 2',
          ru: 'Ответ 2',
        },
      },
      {
        isCorrect: false,
        title: {
          oz: 'Javob 3',
          uz: 'Жавоб 3',
          ru: 'Ответ 3',
        },
      },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one answer is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateAnswerItemDto)
  answers: CreateAnswerItemDto[];
}

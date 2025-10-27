import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ExamAnswerDto {
  @ApiProperty({
    example: 'question-id-123',
    description: 'Question ID',
  })
  @IsString()
  @IsNotEmpty()
  questionId: string;

  @ApiProperty({
    example: 2,
    description: 'Selected answer index (0-based)',
  })
  @IsNumber()
  answer: number;
}

export class SubmitExamDto {
  @ApiProperty({
    type: [ExamAnswerDto],
    description: 'Array of answers for exam questions',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExamAnswerDto)
  answers: ExamAnswerDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class SubmitAnswersDto {
  @ApiProperty({
    type: [String],
    example: ['question-id-1', 'question-id-3', 'question-id-5'],
    description: 'Array of correct question IDs',
  })
  @IsArray()
  @IsString({ each: true })
  correctQuestionIds: string[];
}

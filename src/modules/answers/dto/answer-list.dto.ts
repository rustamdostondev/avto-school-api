import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';
import { IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by answer title (searches in all languages)',
    example: 'javob',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by question ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  questionId?: string;

  @ApiPropertyOptional({
    description: 'Filter by correct answers only',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isCorrect?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'title', 'isCorrect'],
  })
  sortBy?: string = 'createdAt';
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class QuestionListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by question title (searches in all languages)',
    example: 'savol',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by subject ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by ticket ID',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  ticketId?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'title'],
  })
  sortBy?: string = 'createdAt';
}

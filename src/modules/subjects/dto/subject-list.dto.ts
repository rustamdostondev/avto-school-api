import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';

export class SubjectListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by subject name (searches in all languages)',
    example: 'matematika',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'name'],
  })
  sortBy?: string = 'createdAt';
}

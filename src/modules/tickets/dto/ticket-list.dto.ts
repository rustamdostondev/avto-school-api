import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@common/dto/pagination.dto';

export class TicketListDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by ticket name',
    example: 'Bilet 1',
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'name'],
  })
  sortBy?: string = 'createdAt';
}

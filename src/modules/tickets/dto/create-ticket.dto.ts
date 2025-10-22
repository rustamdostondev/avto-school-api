import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CreateTicketDto {
  @ApiProperty({
    example: 'Ticket 1',
    description: 'Ticket name',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;
}

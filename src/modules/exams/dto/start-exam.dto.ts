import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, ValidateIf } from 'class-validator';

export class StartExamDto {
  @ApiProperty({
    example: 'SUBJECT',
    description: 'Type of exam',
    enum: ['SUBJECT', 'TICKET', 'RANDOM'],
  })
  @IsEnum(['SUBJECT', 'TICKET', 'RANDOM'])
  @IsNotEmpty()
  type: 'SUBJECT' | 'TICKET' | 'RANDOM';

  @ApiProperty({
    example: 'subject-id-123',
    description: 'Subject ID for the exam (required for SUBJECT type)',
    required: false,
  })
  @ValidateIf((o) => o.type === 'SUBJECT')
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  subjectId?: string;

  @ApiProperty({
    example: 'ticket-id-123',
    description: 'Ticket ID for the exam (required for TICKET type)',
    required: false,
  })
  @ValidateIf((o) => o.type === 'TICKET')
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  ticketId?: string;
}

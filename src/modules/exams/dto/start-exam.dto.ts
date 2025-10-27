import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class StartExamDto {
  @ApiProperty({
    example: 'subject-id-123',
    description: 'Subject ID for the exam',
  })
  @IsString()
  @IsNotEmpty()
  subjectId: string;
}

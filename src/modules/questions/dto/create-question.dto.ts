import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NameDto } from '@common/dto/name.dto';

export class CreateQuestionDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'Ticket ID' })
  @IsNotEmpty()
  @IsUUID()
  ticketId: string;

  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'Subject ID' })
  @IsNotEmpty()
  @IsUUID()
  subjectId: string;

  @ApiProperty({
    example: {
      oz: 'Savol',
      uz: 'Савол',
      ru: 'Вопрос',
    },
    description: 'Question title in different languages',
  })
  @ValidateNested()
  @Type(() => NameDto)
  title: NameDto;

  @ApiProperty({
    example: {
      oz: "Qo'shimcha ma'lumot",
      uz: 'Қўшимча маълумот',
      ru: 'Дополнительная информация',
    },
    description: 'Additional information about the question in different languages',
    required: false,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => NameDto)
  info?: NameDto;

  @ApiProperty({
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    description: 'File ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fileId?: string;
}

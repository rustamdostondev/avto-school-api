import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NameDto } from '@common/dto/name.dto';

export class CreateAnswerDto {
  @ApiProperty({ example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', description: 'Question ID' })
  @IsNotEmpty()
  @IsUUID()
  questionId: string;

  @ApiProperty({ example: true, description: 'Is this the correct answer?', required: false })
  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @ApiProperty({
    example: {
      oz: 'Javob',
      uz: 'Жавоб',
      ru: 'Ответ',
    },
    description: 'Answer title in different languages',
  })
  @ValidateNested()
  @Type(() => NameDto)
  title: NameDto;
}

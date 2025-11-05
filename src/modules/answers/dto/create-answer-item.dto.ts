import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NameDto } from '@common/dto/name.dto';

export class CreateAnswerItemDto {
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

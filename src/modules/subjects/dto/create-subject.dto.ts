import { ApiProperty } from '@nestjs/swagger';
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { NameDto } from '@common/dto/name.dto';

export class CreateSubjectDto {
  @ApiProperty({
    example: {
      oz: 'Matematika',
      uz: 'Математика',
      ru: 'Математика',
    },
    description: 'Subject name in different languages',
  })
  @ValidateNested()
  @Type(() => NameDto)
  name: NameDto;
}

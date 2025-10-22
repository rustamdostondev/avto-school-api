import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class NameDto {
  @ApiProperty({ example: 'Value in Uzbek (Latin)', description: 'Value in Uzbek (Latin)' })
  @IsString()
  @IsNotEmpty()
  oz: string;

  @ApiProperty({ example: 'Value in Uzbek (Cyrillic)', description: 'Value in Uzbek (Cyrillic)' })
  @IsString()
  @IsNotEmpty()
  uz: string;

  @ApiProperty({ example: 'Value in Russian', description: 'Value in Russian' })
  @IsString()
  @IsNotEmpty()
  ru: string;
}

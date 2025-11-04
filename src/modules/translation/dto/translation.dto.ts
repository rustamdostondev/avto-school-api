import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsInt, Min, Max, MaxLength } from 'class-validator';
import { SupportedLanguages } from '../translation.service';

export class TranslateDto {
  @ApiProperty({
    description: 'Text to translate',
    example: 'Salom dunyo',
    maxLength: 5000,
  })
  @IsString()
  @MaxLength(5000, { message: 'Text cannot exceed 5000 characters' })
  text: string;

  @ApiPropertyOptional({
    description: 'Target language for translation',
    enum: SupportedLanguages,
    example: SupportedLanguages.RUSSIAN,
  })
  @IsOptional()
  @IsEnum(SupportedLanguages)
  targetLanguage?: SupportedLanguages;

  @ApiPropertyOptional({
    description: 'Source language (auto-detect if not specified)',
    example: 'uz',
  })
  @IsOptional()
  @IsString()
  sourceLanguage?: string;

  @ApiPropertyOptional({
    description: 'Request timeout in milliseconds',
    example: 5000,
    minimum: 1000,
    maximum: 30000,
  })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(30000)
  timeout?: number;
}

export class MultiTranslateDto {
  @ApiProperty({
    description: 'Text to translate to multiple languages',
    example: 'Salom dunyo',
    maxLength: 5000,
  })
  @IsString()
  @MaxLength(5000, { message: 'Text cannot exceed 5000 characters' })
  text: string;

  @ApiPropertyOptional({
    description: 'Source language (auto-detect if not specified)',
    example: 'uz',
  })
  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}

export class ConvertScriptDto {
  @ApiProperty({
    description: 'Uzbek text to convert between scripts',
    example: 'Salom dunyo',
    maxLength: 5000,
  })
  @IsString()
  @MaxLength(5000, { message: 'Text cannot exceed 5000 characters' })
  text: string;

  @ApiProperty({
    description: 'Target script',
    enum: ['latin', 'cyrillic'],
    example: 'cyrillic',
  })
  @IsEnum(['latin', 'cyrillic'])
  targetScript: 'latin' | 'cyrillic';
}

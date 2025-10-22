import { ApiProperty } from '@nestjs/swagger';
import { ProcessingStepType } from '@prisma/client';
import { IsArray, IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSequenceDto {
  @ApiProperty({
    default: [ProcessingStepType.WEBSITE_LOADING],
  })
  @IsArray()
  @IsEnum(ProcessingStepType, { each: true })
  stepTypes: ProcessingStepType[];

  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty()
  @IsObject()
  @IsOptional()
  data: any;
}

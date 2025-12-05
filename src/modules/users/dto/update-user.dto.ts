import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'doston1@gmail.com',
    description: 'User email address',
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  accessStartAt?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  accessEndAt?: string;
}

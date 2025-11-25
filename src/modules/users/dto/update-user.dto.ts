import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'doston1@gmail.com',
    description: 'User email address',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'User phone number',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;

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
}

import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
export class CreateUserDto {
  @ApiProperty({
    example: 'doston1@gmail.com',
    description: 'User email address (optional if phoneNumber is provided)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.phoneNumber)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'User phone number (optional if email is provided)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.email)
  @IsNotEmpty()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    example: 'dos130230',
    description: 'User password (minimum 6 characters)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Access start date and time',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : undefined))
  accessStartAt?: string;

  @ApiProperty({
    description: 'Access end date and time',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => (value ? new Date(value).toISOString() : undefined))
  accessEndAt?: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export class RegisterDto {
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
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginDto {
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
    example: 'dos130230',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token',
  })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}

export class TokensResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT refresh token',
  })
  refreshToken: string;
}

export class VerifyOtpDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ default: '111111' })
  otp: string;

  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: 'code' })
  code: string;
}

export class ResendDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ default: 'code' })
  code: string;
}

export class SendOptDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({ default: 'doston1@gmail.com' })
  email: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'doston1@gmail.com',
    description: 'User email address to send reset code (optional if phoneNumber is provided)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.phoneNumber)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '+998901234567',
    description: 'User phone number to send reset code (optional if email is provided)',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.email)
  @IsNotEmpty()
  @IsString()
  phoneNumber?: string;
}

export class VerifyResetCodeDto {
  @ApiProperty({
    example: '111111',
    description: 'OTP code received via email',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({
    example: 'reset_code_123',
    description: 'Reset code identifier',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  code: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: '111111',
    description: 'OTP code received via email',
  })
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  otp: string;

  @ApiProperty({
    example: 'reset_code_123',
    description: 'Reset code identifier',
  })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password for the user',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}

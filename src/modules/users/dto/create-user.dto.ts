import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
export class CreateUserDto {
  @ApiProperty({
    example: 'doston1@gmail.com',
    description: 'User email address',
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

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

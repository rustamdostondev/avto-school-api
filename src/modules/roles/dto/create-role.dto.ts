import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'The name of the role',
    example: 'teacher',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the role',
    example: 'Teacher with course management access',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    example: [1, 2, 3],
    required: false,
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  permissionIds?: number[];
}

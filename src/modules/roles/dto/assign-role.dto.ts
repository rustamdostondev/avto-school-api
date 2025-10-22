import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '@utils';
import { IsArray, IsString } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'The ID of the user to assign roles to',
    example: uuid(),
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Array of role IDs to assign to the user',
    example: [uuid(), uuid()],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  roleIds: string[];
}

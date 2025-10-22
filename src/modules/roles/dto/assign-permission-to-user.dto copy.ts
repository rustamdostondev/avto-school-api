import { ApiProperty } from '@nestjs/swagger';
import { uuid } from '@utils';
import { IsArray, IsString } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({
    description: 'The ID of the user to assign permissions to',
    example: uuid(),
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to the user',
    example: [uuid(), uuid(), uuid()],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  permissionIds: string[];
}

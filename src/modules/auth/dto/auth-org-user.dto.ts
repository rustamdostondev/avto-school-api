import { ApiProperty, OmitType } from '@nestjs/swagger';
import { IsNotEmpty, IsPhoneNumber, IsString, Length } from 'class-validator';

export class RegisterOrgWithUserDto {
  @ApiProperty({ description: 'Taxpayer Identification Number', example: '311013128' })
  @IsString()
  tin: string;

  @ApiProperty({ description: 'User phone number', example: '998887583002' })
  @IsString()
  @IsPhoneNumber('UZ')
  @Length(12, 12)
  phone: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'dos130230',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
export class LoginOrgWithUserDto extends OmitType(RegisterOrgWithUserDto, ['name']) {}

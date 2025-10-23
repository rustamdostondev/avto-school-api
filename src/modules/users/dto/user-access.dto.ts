import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class SetUserAccessPeriodDto {
  @ApiProperty({
    description: 'User ID for whom access period is being set',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Access start date and time',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  accessStartAt?: string;

  @ApiProperty({
    description: 'Access end date and time',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  accessEndAt?: string;
}

export class UpdateUserAccessPeriodDto {
  @ApiProperty({
    description: 'Access start date and time',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  accessStartAt?: string;

  @ApiProperty({
    description: 'Access end date and time',
    example: '2024-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value ? new Date(value).toISOString() : undefined)
  accessEndAt?: string;
}

export class UserAccessStatusDto {
  @ApiProperty({
    description: 'Whether user has access',
    example: true,
  })
  hasAccess: boolean;

  @ApiProperty({
    description: 'Access start date',
    example: '2024-01-01T00:00:00Z',
  })
  accessStartAt: Date | null;

  @ApiProperty({
    description: 'Access end date',
    example: '2024-12-31T23:59:59Z',
  })
  accessEndAt: Date | null;

  @ApiProperty({
    description: 'Current date and time',
    example: '2024-06-15T12:00:00Z',
  })
  currentTime: Date;

  @ApiProperty({
    description: 'Status message',
    example: 'Access is valid',
  })
  message: string;

  @ApiProperty({
    description: 'Days remaining until access expires',
    example: 30,
  })
  daysRemaining?: number;
}

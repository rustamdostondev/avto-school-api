import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Operation successful' })
  message: string;

  @ApiProperty()
  data: T | null;

  @ApiProperty({
    example: {
      code: 'ERROR',
      details: 'Error details',
    },
    nullable: true,
  })
  error: {
    code: string;
    details: string;
  } | null;

  @ApiProperty({
    example: {
      timestamp: '2024-03-12T12:00:00.000Z',
      path: '/api/v1/users',
      pagination: {
        total: 100,
        page: 1,
        limit: 10,
        lastPage: 10,
        prev: null,
        next: 2,
      },
    },
  })
  meta: {
    timestamp: string;
    path: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      lastPage: number;
      prev: number | null;
      next: number | null;
    };
  };
}

export interface IApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  error: {
    code: string;
    details: string;
  } | null;
  meta: {
    timestamp: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      lastPage: number;
    };
  };
}

export function createApiResponse<T>(
  data: T,
  options: {
    success?: boolean;
    statusCode?: number;
    message?: string;
    path: string;
    pagination?: IApiResponse<T>['meta']['pagination'];
  },
): IApiResponse<T> {
  const {
    success = true,
    statusCode = 200,
    message = 'Operation successful',
    pagination,
  } = options;

  return {
    success,
    statusCode,
    message,
    data,
    error: null,
    meta: {
      timestamp: new Date().toISOString(),
      pagination,
    },
  };
}

export function createApiErrorResponse(error: {
  code?: string;
  message: string;
  details?: string;
  statusCode?: number;
  path: string;
}): IApiResponse<null> {
  return {
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message,
    data: null,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      details: error.details || error.message,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
}

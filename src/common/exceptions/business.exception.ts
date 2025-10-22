import { ErrorCode, ErrorCodes } from '@common/constants/error-codes';
import { HttpException, HttpStatus } from '@nestjs/common';

export class BusinessError extends HttpException {
  constructor(code: ErrorCode, message: string, statusCode: number = HttpStatus.BAD_REQUEST) {
    super(
      {
        statusCode,
        message,
        code,
      },
      statusCode,
    );
  }
}

export class ResourceNotFoundException extends BusinessError {
  constructor(
    resource: string,
    code: ErrorCode = ErrorCodes.RESOURCE_NOT_FOUND,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    super(code, `${resource} not found`, statusCode);
  }
}

export class InvalidOperationException extends BusinessError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCodes.INVALID_OPERATION,
    statusCode: number = HttpStatus.BAD_REQUEST,
  ) {
    super(code, message, statusCode);
  }
}

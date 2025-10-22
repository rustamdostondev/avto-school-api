import { ErrorCode, ErrorCodes } from '@common/constants/error-codes';
import { HttpException, HttpStatus } from '@nestjs/common';

export class DatabaseError extends HttpException {
  constructor(code: ErrorCode, message: string, error?: any) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
        code,
        error: error?.message || error,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class QueryFailedException extends DatabaseError {
  constructor(message: string, error?: any) {
    super(ErrorCodes.QUERY_FAILED, message, error);
  }
}

export class DuplicateEntryException extends DatabaseError {
  constructor(entity: string, error?: any) {
    super(ErrorCodes.DUPLICATE_ENTRY, `${entity} already exists`, error);
  }
}

import { HttpException, HttpStatus } from '@nestjs/common';

export class ValidationException extends HttpException {
  details?: Record<string, any>;

  constructor(message: string, details?: Record<string, any>) {
    super(message, HttpStatus.BAD_REQUEST);
    this.details = details;
  }
}

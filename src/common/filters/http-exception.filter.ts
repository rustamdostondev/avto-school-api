import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCodes } from '@common/constants/error-codes';
import { BusinessError } from '@common/exceptions/business.exception';
import { DatabaseError } from '@common/exceptions/database.exception';
import { CustomApiResponse } from '@common/utils/api-response.util';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = ErrorCodes.INTERNAL_SERVER_ERROR;
    let details: any = null;
    let errorType = 'UnknownError';

    if (exception instanceof HttpException) {
      const response = exception.getResponse() as any;
      statusCode = exception.getStatus();
      message = response.message || exception.message;
      code = response.code || ErrorCodes.INTERNAL_SERVER_ERROR;
      details = response.details || null;
      errorType = 'HttpException';
    } else if (exception instanceof BusinessError) {
      const response = exception.getResponse() as any;
      statusCode = exception.getStatus();
      message = response.message;
      code = response.code;
      details = response.details || null;
      errorType = 'BusinessError';
    } else if (exception instanceof DatabaseError) {
      const response = exception.getResponse() as any;
      statusCode = exception.getStatus();
      message = response.message;
      code = response.code;
      details = response.details || null;
      errorType = 'DatabaseError';
    } else if (exception instanceof Error) {
      message = exception.message;
      errorType = exception.constructor.name;
    }

    const errorResponse = CustomApiResponse.error(message, statusCode, details, code);

    // Enhanced error logging with more context
    console.log(message, {
      statusCode,
      code,
      details,
      errorType,
      exception,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
      headers: this.sanitizeHeaders(request.headers),
      query: request.query,
      params: request.params,
      body: this.sanitizeBody(request.body),
    });

    response.status(statusCode).json(errorResponse);
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
    sensitiveHeaders.forEach((header) => {
      if (header in sanitized) {
        sanitized[header] = '[REDACTED]';
      }
    });
    return sanitized;
  }

  private sanitizeBody(body: any): any {
    if (!body) return null;
    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'authorization'];
    sensitiveFields.forEach((field) => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });
    return sanitized;
  }
}

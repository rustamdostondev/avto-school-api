import { createApiResponse, IApiResponse } from '@common/interfaces/api-response.interface';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<IApiResponse<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    return next.handle().pipe(
      map((data) => {
        // If the response is already in our API format, return it as is
        if (data && 'success' in data && 'meta' in data) {
          return data;
        }

        // Otherwise, transform it into our API format
        return createApiResponse(data, {
          statusCode: response.statusCode,
          path: request.url,
          pagination: data?.pagination,
        });
      }),
    );
  }
}

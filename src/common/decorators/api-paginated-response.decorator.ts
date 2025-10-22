import { ApiResponseDto } from '@common/interfaces/api-response.interface';
import { applyDecorators, Type } from '@nestjs/common';
import { ApiOkResponse, getSchemaPath } from '@nestjs/swagger';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description?: string,
) => {
  return applyDecorators(
    ApiOkResponse({
      description: description || 'Successfully retrieved list',
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: 'object',
                properties: {
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                  path: {
                    type: 'string',
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      page: {
                        type: 'number',
                      },
                      limit: {
                        type: 'number',
                      },
                      totalItems: {
                        type: 'number',
                      },
                      totalPages: {
                        type: 'number',
                      },
                      hasNextPage: {
                        type: 'boolean',
                      },
                      hasPreviousPage: {
                        type: 'boolean',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

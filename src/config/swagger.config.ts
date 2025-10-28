import { ApiResponseDto } from '@common/interfaces/api-response.interface';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import * as basicAuth from 'express-basic-auth';

export function setupSwagger(app: INestApplication) {
  const swaggerPath = 'api/docs';

  const options = new DocumentBuilder()
    .setTitle('AUTO SCHOOL API')
    .setDescription('The AUTO SCHOOL API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        description: 'Default JWT Authorization',
        type: 'http',
        in: 'header',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'authorization',
    )

    .addTag('Auth', 'Authentication management endpoints')
    .addTag('Files', 'Files management endpoints')
    .addTag('Roles', 'User roles management endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Queue', 'Queue management endpoints')
    .addTag('Subjects', 'Subjects management endpoints')
    .addTag('Tickets', 'Tickets management endpoints')
    .addTag('Questions', 'Questions management endpoints')
    .addTag('Answers', 'Answers management endpoints')
    .addTag('Exams', 'Exams management endpoints')
    .build();

  // Add basic auth protection for Swagger UI
  // app.use(
  //   [`/${swaggerPath}`, `/${swaggerPath}-json`],
  //   basicAuth({
  //     challenge: true,
  //     users: {
  //       dosya: '130230',
  //     },
  //   }),
  // );

  const document = SwaggerModule.createDocument(app, options, {
    extraModels: [ApiResponseDto],
  });

  // Customize Swagger UI
  const customOptions = {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      displayRequestDuration: true,
      tryItOutEnabled: true,
    },
    customSiteTitle: 'AUTO SCHOOL API',
  };

  SwaggerModule.setup(swaggerPath, app, document, customOptions);

  return {
    swaggerPath,
  };
}

import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { setupSwagger } from '@config/swagger.config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve static files from public directory
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'api/v',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global transform interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Setup Swagger
  const swagger = setupSwagger(app);

  await app.listen(process.env.PORT || 3000);

  // Log application details
  const baseUrl = await app.getUrl();

  console.log(`🚀 Application is running on: ${baseUrl}`);
  console.log(`⚽️ Websocket is running on: ws://localhost:${process.env.PORT || 3000}`);
  console.log(`📚 API Documentation available at: ${baseUrl}/${swagger.swaggerPath}`);
}
bootstrap();

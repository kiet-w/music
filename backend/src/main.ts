import { config } from 'dotenv';
config({ override: true });

// ── Sentry: must be initialized before anything else ──────────────────────
import * as Sentry from '@sentry/node';
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}
// ──────────────────────────────────────────────────────────────────────────

import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AppLogger } from './common/logger/app.logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const corsOriginsEnv = process.env.CORS_ORIGINS;
  if (!corsOriginsEnv) {
    console.error('CORS_ORIGINS environment variable is missing. Application must fail-closed.');
    throw new Error('CORS_ORIGINS environment variable is missing. Application must fail-closed.');
  }

  const corsOrigins = corsOriginsEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (corsOrigins.length === 0) {
    console.error('CORS_ORIGINS environment variable is empty. Application must fail-closed.');
    throw new Error('CORS_ORIGINS environment variable is empty. Application must fail-closed.');
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = new AppLogger();
  app.useLogger(logger);



  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: '*',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapterHost, logger as any),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Music API')
    .setDescription('The music application API description')
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, documentFactory);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Backend Music App started on http://localhost:${port}`, 'Bootstrap');
}
void bootstrap();

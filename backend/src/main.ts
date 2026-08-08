import * as cookieParser from 'cookie-parser';
import * as Sentry from '@sentry/node';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AppLogger } from './common/logger/app.logger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new AppLogger();

  app.useLogger(logger);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cookieParser());

  // Protect /metrics from external access
  app.use('/metrics', (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.toString().split(',')[0].trim() || req.socket.remoteAddress || '';
    const isInternal = ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(ip) || /^(10\.|172\.|192\.168\.)/.test(ip);
    if (!ip || isInternal) return next();
    res.status(403).json({ message: 'Forbidden' });
  });

  const origins = (process.env.CORS_ORIGINS || 'http://localhost:3003').split(',').map((s) => s.trim());
  app.enableCors({ origin: origins, credentials: true });

  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost), logger as any));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder().setTitle('Music API').setVersion('1.0').build();
    SwaggerModule.setup('api', app, () => SwaggerModule.createDocument(app, config));
    logger.log('📄 Swagger docs available at /api', 'Bootstrap');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 Backend Music App started on port ${port}`, 'Bootstrap');
}

void bootstrap();

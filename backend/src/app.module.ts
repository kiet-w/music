import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppLoggerModule } from './common/logger/app-logger.module';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './core/app.controller';
import { AppService } from './core/app.service';
import { DownloaderModule } from './downloader/downloader.module';
import { StorageModule } from './storage/storage.module';
import { JobsModule } from './jobs/jobs.module';
import { PrismaModule } from './prisma/prisma.module';
import { SongsModule } from './songs/songs.module';
import { AlbumsModule } from './albums/albums.module';
import { GoogleDriveModule } from './google-drive/google-drive.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { MessagesModule } from './messages/messages.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { UploadModule } from './upload/upload.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { ThrottlerModule } from '@nestjs/throttler';
import {
  PrometheusModule,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import { HttpMetricsInterceptor } from './common/interceptors/http-metrics.interceptor';

@Module({
  imports: [
    AppLoggerModule,
    PrometheusModule.register({
      path: '/metrics',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100, // General API limit
      },
      {
        ttl: 60000,
        limit: 20, // Auth endpoints
      },
      {
        ttl: 60000,
        limit: 50, // Upload endpoints
      },
    ]),

    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        autoLogging: false,
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        redact: {
          paths: ['req.headers.authorization', 'req.headers.cookie'],
          censor: '[REDACTED]',
        },
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  messageFormat: '[{context}] {msg}',
                  ignore:
                    'context,hostname,pid,req.remoteAddress,req.remotePort,res.headers,reqId,responseTime,_separator',
                  colorize: true,
                  translateTime: 'SYS:HH:MM:ss',
                  hideObject: true,
                },
              }
            : undefined,
      },
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds
    }),
    DownloaderModule,
    StorageModule,
    JobsModule,
    PrismaModule,
    SongsModule,
    AlbumsModule,
    GoogleDriveModule,
    AdminModule,
    AuthModule,
    MessagesModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    UploadModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
    }),
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpMetricsInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // CacheInterceptor should be applied selectively, not globally
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
})
export class AppModule {}

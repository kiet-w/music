import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
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
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    AppLoggerModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

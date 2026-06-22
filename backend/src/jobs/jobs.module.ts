import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConversionProcessor } from './conversion.processor';
import { DownloaderModule } from '../downloader/downloader.module';
import { StorageModule } from '../storage/storage.module';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        tls: process.env.REDIS_HOST?.includes('upstash') ? {} : undefined,
      },
    }),
    BullModule.registerQueue({
      name: 'conversion',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    }),
    DownloaderModule,
    StorageModule,
  ],
  providers: [ConversionProcessor, CleanupService],
  exports: [BullModule],
})
export class JobsModule {}

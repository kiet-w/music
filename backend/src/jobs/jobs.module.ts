import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConversionProcessor } from './conversion.processor';
import { DownloaderModule } from '../downloader/downloader.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    BullModule.registerQueue({
      name: 'conversion',
    }),
    DownloaderModule,
    StorageModule,
  ],
  providers: [ConversionProcessor],
  exports: [BullModule],
})
export class JobsModule {}

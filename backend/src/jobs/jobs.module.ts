import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConversionProcessor } from './conversion.processor';
import { DownloaderModule } from '../downloader/downloader.module';
import { StorageModule } from '../storage/storage.module';
import { CleanupService } from './cleanup.service';
import { makeGaugeProvider } from '@willsoto/nestjs-prometheus';
import { JobsMetricsService } from './jobs.metrics.service';

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
  providers: [
    ConversionProcessor, 
    CleanupService,
    makeGaugeProvider({
      name: 'bullmq_queue_jobs_waiting',
      help: 'Number of jobs waiting in the queue',
      labelNames: ['queue'],
    }),
    makeGaugeProvider({
      name: 'bullmq_queue_jobs_active',
      help: 'Number of jobs currently active in the queue',
      labelNames: ['queue'],
    }),
    makeGaugeProvider({
      name: 'bullmq_queue_jobs_completed',
      help: 'Number of jobs completed in the queue',
      labelNames: ['queue'],
    }),
    makeGaugeProvider({
      name: 'bullmq_queue_jobs_failed',
      help: 'Number of jobs failed in the queue',
      labelNames: ['queue'],
    }),
    JobsMetricsService,
  ],
  exports: [BullModule],
})
export class JobsModule {}

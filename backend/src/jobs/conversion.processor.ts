import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { DownloaderService } from '../downloader/services/downloader.service';
import { StorageService } from '../storage/services/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { AppLogger } from '../common/logger/app.logger';
import * as path from 'path';
import * as fs from 'fs/promises';

@Processor('conversion', { concurrency: 2 })
export class ConversionProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(ConversionProcessor.name)
    private readonly logger: PinoLogger,
    private readonly downloaderService: DownloaderService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
    private readonly appLogger: AppLogger,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { url, songId, userId } = job.data;
    const processName = 'YouTube Conversion';

    this.appLogger.startSection(
      processName,
      `jobId=${job.id} songId=${songId}`,
    );

    const tempDir = path.join(process.cwd(), 'temp');
    await fs.mkdir(tempDir, { recursive: true });
    const outputPath = path.join(tempDir, `${songId}.mp3`);

    try {
      // 1. Download from YouTube
      this.appLogger.step('Downloading from YouTube');
      await this.downloaderService.download(url, outputPath);

      // 2. Upload to Supabase Storage using stream to avoid OOM
      this.appLogger.step('Uploading to Supabase Storage');
      const storagePath = `songs/${songId}.mp3`;
      const fileStream = fs.createReadStream(outputPath);
      await this.storageService.uploadStream(fileStream, 'music', storagePath);

      // 3. Get Public URL
      this.appLogger.step('Getting public URL');
      const publicUrl = await this.storageService.getPublicUrl(
        'music',
        storagePath,
      );

      // 4. Update Database
      this.appLogger.step('Updating database record');
      await this.prisma.track.update({
        where: { id: songId },
        data: { url: publicUrl },
      });

      // 5. Cleanup temp file
      this.appLogger.step('Cleaning up temp file');
      await this.downloaderService.cleanup(outputPath);

      this.appLogger.endSection(processName, `songId=${songId}`);
      return { storagePath, publicUrl };
    } catch (error) {
      this.appLogger.processError(processName, error, 'Job Processing');
      await this.downloaderService.cleanup(outputPath);
      throw error;
    }
  }

  @OnWorkerEvent('error')
  onError(err: Error) {
    this.logger.error({ error: err.message }, '❌ BullMQ worker error');
  }
}

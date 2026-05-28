import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { DownloaderService } from '../downloader/downloader.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

@Processor('conversion')
export class ConversionProcessor extends WorkerHost {
  private readonly logger = new Logger(ConversionProcessor.name);

  constructor(
    private readonly downloaderService: DownloaderService,
    private readonly storageService: StorageService,
    private readonly prisma: PrismaService,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { url, songId } = job.data;
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const outputPath = path.join(tempDir, `${songId}.mp3`);

    try {
      // 1. Download from YouTube
      await this.downloaderService.download(url, outputPath);

      // 2. Upload to Supabase Storage
      const storagePath = `songs/${songId}.mp3`;
      await this.storageService.upload(outputPath, 'music', storagePath);

      // 3. Get Public URL
      const publicUrl = await this.storageService.getPublicUrl(
        'music',
        storagePath,
      );

      // 4. Update Database
      await this.prisma.track.update({
        where: { id: songId },
        data: { url: publicUrl },
      });

      // 5. Cleanup temp file
      await this.downloaderService.cleanup(outputPath);

      return { storagePath, publicUrl };
    } catch (error) {
      this.logger.error('Job failed:', error);
      await this.downloaderService.cleanup(outputPath);
      throw error;
    }
  }
}

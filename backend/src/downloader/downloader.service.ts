/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { IDownloaderProvider } from '../common/interfaces/downloader-provider.interface';
import ytDlp from 'yt-dlp-exec';
import * as ffmpegStatic from 'ffmpeg-static';

@Injectable()
export class DownloaderService implements IDownloaderProvider {
  private readonly audioBitrate = '320K';

  constructor(
    @InjectPinoLogger(DownloaderService.name)
    private readonly logger: PinoLogger,
  ) {}

  async download(url: string, outputPath: string): Promise<void> {
    try {
      this.logger.info({ url, outputPath }, 'Starting download');
      
      await ytDlp(url, {
        f: 'bestaudio/best',
        extractorArgs: 'youtube:player_client=web',
        noPlaylist: true,
        retries: 3,
        fragmentRetries: 3,
        socketTimeout: 30,
        x: true,
        audioFormat: 'mp3',
        audioQuality: this.audioBitrate,
        ffmpegLocation: ffmpegStatic as unknown as string,
        o: outputPath,
      });

      this.logger.info({ outputPath }, 'Download completed');
    } catch (error: any) {
      const exitCode = error.code ?? 'unknown';
      const stderr = (error.stderr as string) ?? '';

      // Classify errors more specifically
      if (stderr.includes('Requested format is not available')) {
        this.logger.error({ exitCode }, '[Downloader] Format unavailable');
        throw new BadRequestException(
          'Audio format not available for this video',
        );
      }

      if (stderr.includes('Video unavailable')) {
        this.logger.error({ exitCode }, '[Downloader] Video unavailable');
        throw new NotFoundException(
          'Video is unavailable or private',
        );
      }

      // Generic fallback with privacy-aware logging (no URL, truncated stderr)
      this.logger.error(
        {
          exitCode,
          hint: stderr.slice(0, 200),
        },
        '[Downloader] Unexpected error',
      );

      throw new InternalServerErrorException(`yt-dlp download failed`);
    }
  }

  async cleanup(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.info({ filePath }, 'Temporary file cleaned up');
      }
    } catch (error) {
      this.logger.error(
        { filePath, error: error.message },
        'Failed to cleanup file',
      );
    }
  }
}

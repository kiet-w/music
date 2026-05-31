/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { IDownloaderProvider } from '../common/interfaces/downloader-provider.interface';

const execAsync = promisify(exec);

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
      // Extract audio using 'bestaudio/best' with web client to avoid 'format not available' errors.
      await execAsync(
        `yt-dlp -f "bestaudio/best" --extractor-args "youtube:player_client=web" --no-playlist --retries 3 --fragment-retries 3 --socket-timeout 30 -x --audio-format mp3 --audio-quality ${this.audioBitrate} -o "${outputPath}" "${url}"`,
      );
      this.logger.info({ outputPath }, 'Download completed');
    } catch (error: any) {
      const exitCode = error.code ?? 'unknown';
      const stderr = (error.stderr as string) ?? '';

      // Classify errors more specifically
      if (stderr.includes('Requested format is not available')) {
        this.logger.error({ exitCode }, '[Downloader] Format unavailable');
        throw new InternalServerErrorException(
          'Audio format not available for this video',
        );
      }

      if (stderr.includes('Video unavailable')) {
        this.logger.error({ exitCode }, '[Downloader] Video unavailable');
        throw new InternalServerErrorException(
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

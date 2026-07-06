import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { IDownloaderProvider } from '../../common/interfaces/downloader-provider.interface';
import { execFile } from 'child_process';
import { promisify } from 'util';

const ffmpegStatic = require('ffmpeg-static');
const execFileAsync = promisify(execFile);

@Injectable()
export class DownloaderService implements IDownloaderProvider {
  private readonly audioBitrate = '128K';

  constructor(
    @InjectPinoLogger(DownloaderService.name)
    private readonly logger: PinoLogger,
  ) {}

  async download(url: string, outputPath: string): Promise<void> {
    // Defense-in-depth: block SSRF even if DTO validation is bypassed
    const ALLOWED_HOSTS = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'music.youtube.com',
      'youtu.be',
      'www.youtu.be',
    ];
    try {
      const parsedUrl = new URL(url);
      if (!ALLOWED_HOSTS.includes(parsedUrl.hostname.toLowerCase())) {
        throw new BadRequestException('Only YouTube URLs are allowed');
      }
    } catch (e) {
      if (e instanceof BadRequestException) throw e;
      throw new BadRequestException('Invalid URL format');
    }

    try {
      this.logger.info({ url, outputPath }, 'Starting download');
      const args = [
        '-f',
        'bestaudio/best',
        '--no-playlist',
        '--retries',
        '3',
        '--fragment-retries',
        '3',
        '--socket-timeout',
        '30',
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        this.audioBitrate,
        '--ffmpeg-location',
        ffmpegStatic as unknown as string,
      ];

      if (fs.existsSync(path.resolve('./cookies.txt'))) {
        args.push('--cookies', path.resolve('./cookies.txt'));
      }

      args.push('-o', outputPath, url);
      await execFileAsync(path.resolve('./yt-dlp'), args);

      this.logger.info({ outputPath }, 'Download completed');
    } catch (error: any) {
      const exitCode = error.code ?? 'unknown'; // eslint-disable-line @typescript-eslint/no-unsafe-member-access
      const stderr = (error.stderr as string) ?? ''; // eslint-disable-line @typescript-eslint/no-unsafe-member-access

      // Classify errors more specifically
      if (stderr.includes('Requested format is not available')) {
        this.logger.error({ exitCode }, '[Downloader] Format unavailable');
        throw new BadRequestException(
          'Audio format not available for this video',
        );
      }

      if (stderr.includes('Video unavailable')) {
        this.logger.error({ exitCode }, '[Downloader] Video unavailable');
        throw new NotFoundException('Video is unavailable or private');
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
        { filePath, error: error.message }, // eslint-disable-line @typescript-eslint/no-unsafe-member-access
        'Failed to cleanup file',
      );
    }
  }
}

import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { IDownloaderProvider } from '../../common/interfaces/downloader-provider.interface';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { ConfigService } from '@nestjs/config';

const ffmpegStatic = require('ffmpeg-static');
const execFileAsync = promisify(execFile);

@Injectable()
export class DownloaderService implements IDownloaderProvider, OnModuleInit {
  private readonly audioBitrate = '128K';
  private resolvedBinaryPath: string | null = null;

  constructor(
    @InjectPinoLogger(DownloaderService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureYtDlpBinary();
    } catch (err: any) {
      this.logger.error({ error: err?.message || err }, '[Downloader] Auto-install of yt-dlp failed during initialization');
    }
  }

  private async ensureYtDlpBinary(): Promise<string> {
    if (this.resolvedBinaryPath && fs.existsSync(this.resolvedBinaryPath)) {
      return this.resolvedBinaryPath;
    }

    const customPath =
      this.configService.get<string>('YTDLP_BINARY_PATH') ||
      process.env.YTDLP_BINARY_PATH;

    const defaultPath = customPath ? path.resolve(customPath) : path.resolve('./yt-dlp');

    // 1. Check if binary exists at default or custom location
    if (fs.existsSync(defaultPath)) {
      this.resolvedBinaryPath = defaultPath;
      return defaultPath;
    }

    // 2. Check if yt-dlp is installed globally in system PATH
    try {
      await execFileAsync('yt-dlp', ['--version']);
      this.resolvedBinaryPath = 'yt-dlp';
      this.logger.info('[Downloader] Using system yt-dlp binary');
      return 'yt-dlp';
    } catch {
      // Not found in system PATH, proceed to auto-download
    }

    // 3. Auto-download latest yt-dlp binary to local folder
    this.logger.info({ defaultPath }, '[Downloader] Downloading latest yt-dlp binary...');
    try {
      await this.downloadYtDlpBinary(defaultPath);
      fs.chmodSync(defaultPath, 0o755);
      this.resolvedBinaryPath = defaultPath;
      this.logger.info({ defaultPath }, '[Downloader] Successfully installed yt-dlp binary');
      return defaultPath;
    } catch (downloadErr: any) {
      this.logger.error({ error: downloadErr?.message || downloadErr }, '[Downloader] Failed to download yt-dlp binary');
      throw downloadErr;
    }
  }

  private downloadYtDlpBinary(dest: string): Promise<void> {
    const downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);

      const request = (url: string) => {
        https.get(url, (response) => {
          // Handle HTTP redirects (301, 302, 307, 308)
          if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return request(response.headers.location);
          }

          if (response.statusCode !== 200) {
            return reject(new Error(`Failed to download yt-dlp: HTTP ${response.statusCode}`));
          }

          response.pipe(file);

          file.on('finish', () => {
            file.close(() => resolve());
          });
        }).on('error', (err) => {
          fs.unlink(dest, () => reject(err));
        });
      };

      request(downloadUrl);
    });
  }

  private getCookiesPath(): string {
    const customPath =
      this.configService.get<string>('YTDLP_COOKIES_PATH') ||
      process.env.YTDLP_COOKIES_PATH;
    return customPath ? path.resolve(customPath) : path.resolve('./cookies.txt');
  }

  async download(url: string, outputPath: string): Promise<void> {
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

    const binaryPath = await this.ensureYtDlpBinary();

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

      const cookiesPath = this.getCookiesPath();
      if (fs.existsSync(cookiesPath)) {
        args.push('--cookies', cookiesPath);
      }

      args.push('-o', outputPath, url);
      await execFileAsync(binaryPath, args);

      this.logger.info({ outputPath }, 'Download completed');
    } catch (error: any) {
      const exitCode = error.code ?? 'unknown'; // eslint-disable-line @typescript-eslint/no-unsafe-member-access
      const stderr = (error.stderr as string) ?? ''; // eslint-disable-line @typescript-eslint/no-unsafe-member-access

      if (stderr.includes('Requested format is not available')) {
        this.logger.error({ exitCode }, '[Downloader] Format unavailable');
        throw new BadRequestException('Audio format not available for this video');
      }

      if (stderr.includes('Video unavailable')) {
        this.logger.error({ exitCode }, '[Downloader] Video unavailable');
        throw new NotFoundException('Video is unavailable or private');
      }

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
    } catch (error: any) {
      this.logger.error(
        { filePath, error: error?.message },
        'Failed to cleanup file',
      );
    }
  }

  async getVideoInfo(url: string): Promise<{ title: string; artist?: string }> {
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

    const binaryPath = await this.ensureYtDlpBinary();

    try {
      const args = [
        '--dump-json',
        '--no-playlist',
      ];

      const cookiesPath = this.getCookiesPath();
      if (fs.existsSync(cookiesPath)) {
        args.push('--cookies', cookiesPath);
      }

      args.push(url);

      const { stdout } = await execFileAsync(binaryPath, args);
      const info = JSON.parse(stdout);

      return {
        title: info.title,
        artist: info.uploader || info.channel || info.artist,
      };
    } catch (error: any) {
      this.logger.error({ error: error?.message }, '[Downloader] Failed to fetch video info');
      throw new InternalServerErrorException('Failed to fetch video info');
    }
  }
}

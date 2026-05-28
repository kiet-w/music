/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import { IDownloaderProvider } from '../common/interfaces/downloader-provider.interface';

const execAsync = promisify(exec);

@Injectable()
export class DownloaderService implements IDownloaderProvider {
  private readonly logger = new Logger(DownloaderService.name);

  async download(url: string, outputPath: string): Promise<void> {
    try {
      this.logger.log(`Starting download from ${url} to ${outputPath}`);
      // Basic yt-dlp command to download audio as mp3
      // -x: extract audio, --audio-format: mp3, -o: output path
      await execAsync(
        `yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`,
      );
      this.logger.log(`Download completed: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Download failed for URL ${url}: ${error.message}`);
      throw new InternalServerErrorException(
        `yt-dlp download failed: ${error.message}`,
      );
    }
  }

  async cleanup(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Temporary file cleaned up: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to cleanup file ${filePath}: ${error.message}`);
    }
  }
}

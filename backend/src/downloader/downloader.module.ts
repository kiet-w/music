import { Module } from '@nestjs/common';
import { DownloaderService } from './downloader.service';

@Module({
  providers: [DownloaderService],
  exports: [DownloaderService],
})
export class DownloaderModule {}

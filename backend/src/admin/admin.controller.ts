import {
  Controller,
  Delete,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { SongRepository } from '../songs/repositories/song.repository';
import { StorageCleanupService } from '../storage/storage-cleanup.service';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly storageCleanupService: StorageCleanupService,
  ) {}

  @Delete('tracks/:id')
  async deleteTrack(@Param('id') id: string) {
    return this.songRepository.delete({
      where: { id },
    });
  }

  @Post('storage/cleanup')
  @HttpCode(HttpStatus.OK)
  async cleanupStorage(@Body() body: { bucketName: string; path: string }) {
    await this.storageCleanupService.cleanupFile(body.bucketName, body.path);
    return { message: 'Storage cleanup initiated', file: body.path };
  }
}

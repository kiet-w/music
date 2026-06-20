import { Injectable } from '@nestjs/common';
import { SongRepository } from '../../songs/repositories/song.repository';
import { StorageCleanupService } from '../../storage/services/storage-cleanup.service';
import { CleanupStorageDto } from '../dtos/cleanup-storage.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly storageCleanupService: StorageCleanupService,
  ) {}

  async deleteTrack(id: string) {
    return this.songRepository.delete({
      where: { id },
    });
  }

  async cleanupStorage(dto: CleanupStorageDto) {
    await this.storageCleanupService.cleanupFile(dto.bucketName, dto.path);
    return { 
      message: 'Storage cleanup initiated', 
      file: dto.path 
    };
  }
}

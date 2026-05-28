import { Injectable, Inject, Logger } from '@nestjs/common';
import type { IStorageProvider } from '../common/interfaces/storage-provider.interface';

@Injectable()
export class StorageCleanupService {
  private readonly logger = new Logger(StorageCleanupService.name);

  constructor(
    @Inject('IStorageProvider')
    private readonly storageProvider: IStorageProvider,
  ) {}

  async cleanupFile(bucketName: string, path: string): Promise<void> {
    this.logger.log(
      `Initiating cleanup for file: ${path} in bucket: ${bucketName}`,
    );
    await this.storageProvider.delete(bucketName, path);
  }
}

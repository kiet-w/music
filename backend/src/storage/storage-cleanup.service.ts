import { Injectable, Inject } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import type { IStorageProvider } from '../common/interfaces/storage-provider.interface';

@Injectable()
export class StorageCleanupService {
  constructor(
    @InjectPinoLogger(StorageCleanupService.name)
    private readonly logger: PinoLogger,
    @Inject('IStorageProvider')
    private readonly storageProvider: IStorageProvider,
  ) {}

  async cleanupFile(bucketName: string, path: string): Promise<void> {
    this.logger.info({ bucketName, path }, 'Initiating cleanup for file');
    await this.storageProvider.delete(bucketName, path);
  }
}

import { Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { StorageCleanupService } from './services/storage-cleanup.service';

@Module({
  providers: [
    StorageService,
    {
      provide: 'IStorageProvider',
      useExisting: StorageService,
    },
    StorageCleanupService,
  ],
  exports: ['IStorageProvider', StorageCleanupService, StorageService],
})
export class StorageModule {}

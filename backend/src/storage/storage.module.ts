import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageCleanupService } from './storage-cleanup.service';

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

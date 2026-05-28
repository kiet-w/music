import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { SongsModule } from '../songs/songs.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [SongsModule, StorageModule],
  controllers: [AdminController],
})
export class AdminModule {}

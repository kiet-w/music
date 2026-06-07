import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SongsModule } from '../songs/songs.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [SongsModule, StorageModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

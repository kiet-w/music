import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { GoogleDriveController } from './google-drive.controller';
import { SongsModule } from '../songs/songs.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [SongsModule, StorageModule],
  providers: [GoogleDriveService],
  controllers: [GoogleDriveController],
})
export class GoogleDriveModule {}

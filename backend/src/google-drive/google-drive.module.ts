import { Module } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { GoogleDriveController } from './google-drive.controller';
import { MusicController } from './music.controller';
import { SongsModule } from '../songs/songs.module';
import { StorageModule } from '../storage/storage.module';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [SongsModule, StorageModule, AlbumsModule],
  providers: [GoogleDriveService],
  controllers: [GoogleDriveController, MusicController],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}

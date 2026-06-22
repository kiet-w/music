import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GoogleDriveService } from './google-drive.service';
import { GoogleDriveController } from './google-drive.controller';
import { MusicController } from './music.controller';
import { SongsModule } from '../songs/songs.module';
import { StorageModule } from '../storage/storage.module';
import { AlbumsModule } from '../albums/albums.module';
import { EncryptionService } from '../common/services/encryption.service';

@Module({
  imports: [ConfigModule, SongsModule, StorageModule, AlbumsModule],
  providers: [GoogleDriveService, EncryptionService],
  controllers: [GoogleDriveController, MusicController],
  exports: [GoogleDriveService],
})
export class GoogleDriveModule {}

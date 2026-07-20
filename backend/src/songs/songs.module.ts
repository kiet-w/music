import { Module } from '@nestjs/common';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { JobsModule } from '../jobs/jobs.module';
import { SongRepository } from './repositories/song.repository';
import { AlbumsModule } from '../albums/albums.module';
import { AlbumValidationHelper } from './helper/album-validation.helper';
import { DownloaderModule } from '../downloader/downloader.module';

@Module({
  imports: [JobsModule, AlbumsModule, DownloaderModule],
  controllers: [SongsController],
  providers: [SongsService, SongRepository, AlbumValidationHelper],
  exports: [SongRepository],
})
export class SongsModule {}

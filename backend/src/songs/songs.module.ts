import { Module } from '@nestjs/common';
import { SongController } from './song.controller';
import { SongService } from './song.service';
import { JobsModule } from '../jobs/jobs.module';
import { SongRepository } from './repositories/song.repository';
import { AlbumsModule } from '../albums/albums.module';

@Module({
  imports: [JobsModule, AlbumsModule],
  controllers: [SongController],
  providers: [SongService, SongRepository],
  exports: [SongRepository],
})
export class SongsModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { JobsModule } from '../jobs/jobs.module';
import { SongRepository } from './repositories/song.repository';
import { AlbumsModule } from '../albums/albums.module';
import { YoutubeSongHelper } from './helper/youtube-song.helper';
import { AlbumValidationHelper } from './helper/album-validation.helper';
import { CreateSongFromYoutubeHandler } from './commands/create-youtube-song/create-youtube.song.handler';
import { RemoveSongHandler } from './commands/remove-song/remove-song.handler';
import { MoveSongToAlbumHandler } from './commands/move-song/move-song-to-album.handler';

import { FindAllSongsHandler } from './queries/find-all-songs/find-all-songs.handler';
import { FindOneSongHandler } from './queries/find-one-song/find-one-song.handler';

const CommandHandlers = [
  CreateSongFromYoutubeHandler,
  RemoveSongHandler,
  MoveSongToAlbumHandler,
];

const QueryHandlers = [
  FindAllSongsHandler,
  FindOneSongHandler,
];

@Module({
  imports: [JobsModule, AlbumsModule, CqrsModule],
  controllers: [SongsController],
  providers: [
    SongsService,
    SongRepository,
    YoutubeSongHelper,
    AlbumValidationHelper,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [SongRepository],
})
export class SongsModule {}

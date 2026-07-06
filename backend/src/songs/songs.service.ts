import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SongResponseDto } from './dto/song-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreateSongYoutubeDto } from './dto/create-song-youtube.dto';
import { MoveSongDto } from './dto/move-song.dto';
import { CreateSongFromYoutubeCommand } from './commands/create-youtube-song/create-youtube.song.command';
import { RemoveSongCommand } from './commands/remove-song/remove-song.command';
import { MoveSongToAlbumCommand } from './commands/move-song/move-song-to-album.command';
import { FindAllSongsQuery } from './queries/find-all-songs/find-all-songs.query';
import { FindOneSongQuery } from './queries/find-one-song/find-one-song.query';

@Injectable()
export class SongsService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  async createFromYoutube(
    userId: string,
    dto: CreateSongYoutubeDto,
  ): Promise<SongResponseDto> {
    const command = new CreateSongFromYoutubeCommand(
      userId,
      dto.url,
      dto.title,
      dto.artist,
      dto.albumId,
    );
    return this.commandBus.execute(command);
  }
  async findAll(userId: string, paginationDto: PaginationDto) {
    const query = new FindAllSongsQuery(userId, paginationDto);
    return this.queryBus.execute(query);
  }
  async findOne(userId: string, id: string): Promise<SongResponseDto> {
    const query = new FindOneSongQuery(userId, id);
    return this.queryBus.execute(query);
  }
  async remove(userId: string, id: string): Promise<void> {
    const command = new RemoveSongCommand(userId, id);
    return this.commandBus.execute(command);
  }
  async moveToAlbum(
    userId: string,
    id: string,
    dto: MoveSongDto,
  ): Promise<SongResponseDto> {
    const command = new MoveSongToAlbumCommand(userId, id, dto.albumId);
    return this.commandBus.execute(command);
  }
}

import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SongsService } from './songs.service';
import { CreateSongFromYoutubeCommand } from './commands/create-youtube-song/create-youtube.song.command';
import { RemoveSongCommand } from './commands/remove-song/remove-song.command';
import { MoveSongToAlbumCommand } from './commands/move-song/move-song-to-album.command';
import { FindAllSongsQuery } from './queries/find-all-songs/find-all-songs.query';
import { FindOneSongQuery } from './queries/find-one-song/find-one-song.query';
import { CreateSongYoutubeDto } from './dto/create-song-youtube.dto';
import { MoveSongDto } from './dto/move-song.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

describe('SongsService', () => {
  let service: SongsService;
  let dispatchedCommand: unknown;
  let dispatchedQuery: unknown;
  let commandBus: { execute: jest.Mock };
  let queryBus: { execute: jest.Mock };

  const userId = 'user-1';

  beforeEach(() => {
    dispatchedCommand = undefined;
    dispatchedQuery = undefined;
    commandBus = {
      execute: jest.fn((command: unknown) => {
        dispatchedCommand = command;
        return Promise.resolve('command-result');
      }),
    };
    queryBus = {
      execute: jest.fn((query: unknown) => {
        dispatchedQuery = query;
        return Promise.resolve('query-result');
      }),
    };
    service = new SongsService(
      commandBus as unknown as CommandBus,
      queryBus as unknown as QueryBus,
    );
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromYoutube', () => {
    it('dispatches a CreateSongFromYoutubeCommand built from the dto', async () => {
      const dto: CreateSongYoutubeDto = {
        url: 'https://youtu.be/dQw4w9WgXcQ',
        title: 'Title',
        artist: 'Artist',
        albumId: 'album-1',
      };

      await service.createFromYoutube(userId, dto);

      expect(dispatchedCommand).toBeInstanceOf(CreateSongFromYoutubeCommand);
      expect(dispatchedCommand).toMatchObject({
        userId,
        url: dto.url,
        title: dto.title,
        artist: dto.artist,
        albumId: dto.albumId,
      });
    });
  });

  describe('findAll', () => {
    it('dispatches a FindAllSongsQuery', async () => {
      const paginationDto = new PaginationDto();

      await service.findAll(userId, paginationDto);

      expect(dispatchedQuery).toBeInstanceOf(FindAllSongsQuery);
      expect(dispatchedQuery).toMatchObject({ userId, paginationDto });
    });
  });

  describe('findOne', () => {
    it('dispatches a FindOneSongQuery', async () => {
      await service.findOne(userId, 'song-1');

      expect(dispatchedQuery).toBeInstanceOf(FindOneSongQuery);
      expect(dispatchedQuery).toMatchObject({ userId, id: 'song-1' });
    });
  });

  describe('remove', () => {
    it('dispatches a RemoveSongCommand', async () => {
      await service.remove(userId, 'song-1');

      expect(dispatchedCommand).toBeInstanceOf(RemoveSongCommand);
      expect(dispatchedCommand).toMatchObject({ userId, id: 'song-1' });
    });
  });

  describe('moveToAlbum', () => {
    it('dispatches a MoveSongToAlbumCommand built from the dto', async () => {
      const dto: MoveSongDto = { albumId: 'album-2' };

      await service.moveToAlbum(userId, 'song-1', dto);

      expect(dispatchedCommand).toBeInstanceOf(MoveSongToAlbumCommand);
      expect(dispatchedCommand).toMatchObject({
        userId,
        id: 'song-1',
        albumId: 'album-2',
      });
    });
  });
});

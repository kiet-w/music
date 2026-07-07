import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SongsService } from './songs.service';
import { CreateSongYoutubeDto } from './dto/create-song-youtube.dto';
import { MoveSongDto } from './dto/move-song.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

describe('SongsService', () => {
  let service: SongsService;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  const mockUserId = 'user-123';

  const mockCommandBus = {
    execute: jest.fn(),
  };

  const mockQueryBus = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: QueryBus, useValue: mockQueryBus },
      ],
    }).compile();

    service = module.get<SongsService>(SongsService);
    commandBus = module.get<CommandBus>(CommandBus);
    queryBus = module.get<QueryBus>(QueryBus);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromYoutube', () => {
    it('should dispatch CreateSongFromYoutubeCommand', async () => {
      const dto: CreateSongYoutubeDto = {
        url: 'https://youtube.com/watch?v=12345678901',
        title: 'Test Song',
        artist: 'Test Artist',
        albumId: 'album-123',
      };
      const expectedResponse = { id: 'song-123', title: dto.title };
      mockCommandBus.execute.mockResolvedValue(expectedResponse);

      const result = await service.createFromYoutube(mockUserId, dto);

      expect(result).toEqual(expectedResponse);
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.userId).toBe(mockUserId);
      expect(command.url).toBe(dto.url);
      expect(command.title).toBe(dto.title);
      expect(command.artist).toBe(dto.artist);
      expect(command.albumId).toBe(dto.albumId);
    });
  });

  describe('findAll', () => {
    it('should dispatch FindAllSongsQuery with pagination', async () => {
      const paginationDto: PaginationDto = { page: 1, limit: 10, sort: 'createdAt' };
      const expectedResponse = {
        data: [{ id: '1', title: 'Song 1' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      };
      mockQueryBus.execute.mockResolvedValue(expectedResponse);

      const result = await service.findAll(mockUserId, paginationDto);

      expect(result).toEqual(expectedResponse);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query.userId).toBe(mockUserId);
      expect(query.paginationDto).toBe(paginationDto);
    });
  });

  describe('findOne', () => {
    it('should dispatch FindOneSongQuery', async () => {
      const songId = 'song-123';
      const expectedResponse = { id: songId, title: 'Test Song' };
      mockQueryBus.execute.mockResolvedValue(expectedResponse);

      const result = await service.findOne(mockUserId, songId);

      expect(result).toEqual(expectedResponse);
      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const [query] = mockQueryBus.execute.mock.calls[0];
      expect(query.userId).toBe(mockUserId);
      expect(query.id).toBe(songId);
    });
  });

  describe('remove', () => {
    it('should dispatch RemoveSongCommand', async () => {
      const songId = 'song-123';
      mockCommandBus.execute.mockResolvedValue(undefined);

      await service.remove(mockUserId, songId);

      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.userId).toBe(mockUserId);
      expect(command.id).toBe(songId);
    });
  });

  describe('moveToAlbum', () => {
    it('should dispatch MoveSongToAlbumCommand', async () => {
      const songId = 'song-123';
      const dto: MoveSongDto = { albumId: 'new-album-123' };
      const expectedResponse = { id: songId, albumId: dto.albumId };
      mockCommandBus.execute.mockResolvedValue(expectedResponse);

      const result = await service.moveToAlbum(mockUserId, songId, dto);

      expect(result).toEqual(expectedResponse);
      expect(commandBus.execute).toHaveBeenCalledTimes(1);
      const [command] = mockCommandBus.execute.mock.calls[0];
      expect(command.userId).toBe(mockUserId);
      expect(command.id).toBe(songId);
      expect(command.albumId).toBe(dto.albumId);
    });
  });
});

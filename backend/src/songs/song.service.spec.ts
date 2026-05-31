import { Test, TestingModule } from '@nestjs/testing';
import { SongService } from './song.service';
import { SongRepository } from './repositories/song.repository';
import { AlbumRepository } from '../albums/repositories/album.repository';
import { AlbumService } from '../albums/album.service';
import { getQueueToken } from '@nestjs/bullmq';
import { NotFoundException } from '@nestjs/common';
import { getLoggerToken } from 'nestjs-pino';

describe('SongService', () => {
  let service: SongService;
  let songRepository: SongRepository;
  let albumRepository: AlbumRepository;
  let albumService: AlbumService;
  let queue: any;

  const mockUserId = 'user-123';

  const mockPinoLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockSongRepository = {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockAlbumRepository = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
  };

  const mockAlbumService = {
    findOrCreateDefault: jest.fn(),
  };

  const mockQueue = {
    add: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongService,
        {
          provide: SongRepository,
          useValue: mockSongRepository,
        },
        {
          provide: AlbumRepository,
          useValue: mockAlbumRepository,
        },
        {
          provide: AlbumService,
          useValue: mockAlbumService,
        },
        {
          provide: getQueueToken('conversion'),
          useValue: mockQueue,
        },
        {
          provide: getLoggerToken(SongService.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<SongService>(SongService);
    songRepository = module.get<SongRepository>(SongRepository);
    albumRepository = module.get<AlbumRepository>(AlbumRepository);
    albumService = module.get<AlbumService>(AlbumService);
    queue = module.get(getQueueToken('conversion'));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromYoutube', () => {
    it('should create a song with a provided albumId if it belongs to the user', async () => {
      const url = 'https://youtube.com/watch?v=123';
      const title = 'Test Song';
      const artist = 'Test Artist';
      const albumId = 'album-123';

      mockAlbumRepository.findUnique.mockResolvedValue({ id: albumId, userId: mockUserId });
      const mockSong = { id: 'song-123', title, artist, albumId };
      mockSongRepository.create.mockResolvedValue(mockSong);

      const result = await service.createFromYoutube(mockUserId, url, title, artist, albumId);

      expect(result).toEqual(mockSong);
      expect(mockAlbumRepository.findUnique).toHaveBeenCalledWith({ where: { id: albumId } });
      expect(songRepository.create).toHaveBeenCalledWith({
        data: {
          title,
          artist,
          url: '',
          albumId,
          sourceType: 'youtube',
        },
      });
      expect(queue.add).toHaveBeenCalledWith('convert', { url, songId: 'song-123', userId: mockUserId });
    });

    it('should throw NotFoundException if provided albumId does not belong to the user', async () => {
      const albumId = 'other-user-album';
      mockAlbumRepository.findUnique.mockResolvedValue({ id: albumId, userId: 'other-user' });

      await expect(
        service.createFromYoutube(mockUserId, 'url', 'title', 'artist', albumId)
      ).rejects.toThrow(NotFoundException);
    });

    it('should fallback to default album if no albumId is provided', async () => {
      const url = 'https://youtube.com/watch?v=123';
      const title = 'Test Song';
      const defaultAlbum = { id: 'default-album', title: 'Default', userId: mockUserId };

      mockAlbumService.findOrCreateDefault.mockResolvedValue(defaultAlbum);
      mockSongRepository.create.mockResolvedValue({ id: 'song-123', title, albumId: defaultAlbum.id });

      const result = await service.createFromYoutube(mockUserId, url, title);

      expect(result.albumId).toBe(defaultAlbum.id);
      expect(mockAlbumService.findOrCreateDefault).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe('findAll', () => {
    it('should return songs belonging to the user', async () => {
      const mockSongs = [{ id: '1', title: 'Song 1' }];
      mockSongRepository.findMany.mockResolvedValue(mockSongs);

      const result = await service.findAll(mockUserId);

      expect(result).toEqual(mockSongs);
      expect(songRepository.findMany).toHaveBeenCalledWith({
        where: { album: { userId: mockUserId } },
        include: { album: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a song if it belongs to the user', async () => {
      const songId = 'song-123';
      const mockSong = { id: songId, title: 'Test Song' };
      mockSongRepository.findFirst.mockResolvedValue(mockSong);

      const result = await service.findOne(mockUserId, songId);

      expect(result).toEqual(mockSong);
      expect(songRepository.findFirst).toHaveBeenCalledWith({
        where: { id: songId, album: { userId: mockUserId } },
        include: { album: true },
      });
    });

    it('should return null if song does not exist or belong to user', async () => {
      mockSongRepository.findFirst.mockResolvedValue(null);
      const result = await service.findOne(mockUserId, 'non-existent');
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should delete a song if it belongs to the user', async () => {
      const songId = 'song-123';
      mockSongRepository.findFirst.mockResolvedValue({ id: songId });
      mockSongRepository.delete.mockResolvedValue({ id: songId });

      await service.remove(mockUserId, songId);

      expect(songRepository.findFirst).toHaveBeenCalledWith({
        where: { id: songId, album: { userId: mockUserId } },
      });
      expect(songRepository.delete).toHaveBeenCalledWith({ where: { id: songId } });
    });

    it('should throw NotFoundException if song does not belong to user', async () => {
      mockSongRepository.findFirst.mockResolvedValue(null);
      await expect(service.remove(mockUserId, 'other-song')).rejects.toThrow(NotFoundException);
    });
  });

  describe('moveToAlbum', () => {
    it('should update the albumId if both song and target album belong to the user', async () => {
      const songId = 'song-123';
      const albumId = 'new-album-123';
      
      mockSongRepository.findFirst.mockResolvedValue({ id: songId });
      mockAlbumRepository.findUnique.mockResolvedValue({ id: albumId, userId: mockUserId });
      mockSongRepository.update.mockResolvedValue({ id: songId, albumId });

      const result = await service.moveToAlbum(mockUserId, songId, albumId);

      expect(result.albumId).toBe(albumId);
      expect(songRepository.update).toHaveBeenCalledWith({
        where: { id: songId },
        data: { albumId },
      });
    });

    it('should throw NotFoundException if target album belongs to another user', async () => {
      mockSongRepository.findFirst.mockResolvedValue({ id: 'song-1' });
      mockAlbumRepository.findUnique.mockResolvedValue({ id: 'other-album', userId: 'other-user' });

      await expect(service.moveToAlbum(mockUserId, 'song-1', 'other-album')).rejects.toThrow(NotFoundException);
    });
  });
});

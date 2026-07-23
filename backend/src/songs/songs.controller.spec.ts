import { Test, TestingModule } from '@nestjs/testing';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('SongsController', () => {
  let controller: SongsController;
  let service: SongsService;

  const mockSongsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getYoutubeInfo: jest.fn(),
    createFromYoutube: jest.fn(),
    remove: jest.fn(),
    moveToAlbum: jest.fn(),
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: 'USER',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsController],
      providers: [
        {
          provide: SongsService,
          useValue: mockSongsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<SongsController>(SongsController);
    service = module.get<SongsService>(SongsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of songs', async () => {
      const mockSongs = [
        { id: '1', title: 'Song 1', artist: 'Artist 1' },
        { id: '2', title: 'Song 2', artist: 'Artist 2' },
      ];

      mockSongsService.findAll.mockResolvedValue({
        data: mockSongs,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      const result = await controller.findAll(mockUser as any, { page: 1, limit: 10 } as any);

      expect(result).toEqual({
        data: mockSongs,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(service.findAll).toHaveBeenCalledWith('user-1', { page: 1, limit: 10 });
    });
  });

  describe('findOne', () => {
    it('should return a single song', async () => {
      const mockSong = { id: '1', title: 'Song 1', artist: 'Artist 1' };

      mockSongsService.findOne.mockResolvedValue(mockSong);

      const result = await controller.findOne(mockUser as any, '1');

      expect(result).toEqual(mockSong);
      expect(service.findOne).toHaveBeenCalledWith('user-1', '1');
    });
  });

  describe('getYoutubeInfo', () => {
    it('should return YouTube video info', async () => {
      const mockInfo = {
        title: 'Test Video',
        artist: 'Test Artist',
        duration: 180,
      };

      mockSongsService.getYoutubeInfo.mockResolvedValue(mockInfo);

      const result = await controller.getYoutubeInfo('https://youtube.com/watch?v=test');

      expect(result).toEqual(mockInfo);
      expect(service.getYoutubeInfo).toHaveBeenCalledWith('https://youtube.com/watch?v=test');
    });
  });

  describe('createFromYoutube', () => {
    it('should create a song from YouTube URL', async () => {
      const mockSong = { id: '1', title: 'Song 1', artist: 'Artist 1' };
      const dto = {
        url: 'https://youtube.com/watch?v=test',
        title: 'Song 1',
        artist: 'Artist 1',
      };

      mockSongsService.createFromYoutube.mockResolvedValue(mockSong);

      const result = await controller.createFromYoutube(mockUser as any, dto);

      expect(result).toEqual(mockSong);
      expect(service.createFromYoutube).toHaveBeenCalledWith('user-1', dto);
    });
  });

  describe('remove', () => {
    it('should delete a song', async () => {
      mockSongsService.remove.mockResolvedValue(undefined);

      await controller.remove(mockUser as any, '1');

      expect(service.remove).toHaveBeenCalledWith('user-1', '1');
    });
  });

  describe('moveToAlbum', () => {
    it('should move a song to another album', async () => {
      const mockSong = { id: '1', title: 'Song 1', albumId: 'album-2' };
      const dto = { albumId: 'album-2' };

      mockSongsService.moveToAlbum.mockResolvedValue(mockSong);

      const result = await controller.moveToAlbum(mockUser as any, '1', dto);

      expect(result).toEqual(mockSong);
      expect(service.moveToAlbum).toHaveBeenCalledWith('user-1', '1', dto);
    });
  });
});
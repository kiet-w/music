import { Test, TestingModule } from '@nestjs/testing';
import { AlbumService } from './album.service';
import { AlbumRepository } from './repositories/album.repository';
import { getLoggerToken } from 'nestjs-pino';

describe('AlbumService', () => {
  let service: AlbumService;
  let albumRepository: AlbumRepository;

  const mockUserId = 'user-123';

  const mockPinoLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  const mockAlbumRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findDefault: jest.fn(),
    findByUserAndTitle: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumService,
        {
          provide: AlbumRepository,
          useValue: mockAlbumRepository,
        },
        {
          provide: getLoggerToken(AlbumService.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<AlbumService>(AlbumService);
    albumRepository = module.get<AlbumRepository>(AlbumRepository);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an album for a specific user', async () => {
      const data = { title: 'New Album', artist: 'Artist' };
      const mockAlbum = { id: 'album-1', ...data, userId: mockUserId };
      mockAlbumRepository.create.mockResolvedValue(mockAlbum);

      const result = await service.create(mockUserId, data);

      expect(result).toEqual(mockAlbum);
      expect(albumRepository.create).toHaveBeenCalledWith({
        data: {
          ...data,
          userId: mockUserId,
        },
      });
    });
  });

  describe('findOrCreateDefault', () => {
    it('should return existing default album if it exists', async () => {
      const mockAlbum = { id: 'default-id', title: 'Default', userId: mockUserId, isDefault: true };
      mockAlbumRepository.findDefault.mockResolvedValue(mockAlbum);

      const result = await service.findOrCreateDefault(mockUserId);

      expect(result).toEqual(mockAlbum);
      expect(albumRepository.findDefault).toHaveBeenCalledWith(mockUserId);
      expect(albumRepository.create).not.toHaveBeenCalled();
    });

    it('should create default album if it does not exist', async () => {
      mockAlbumRepository.findDefault.mockResolvedValueOnce(null);
      const mockAlbum = { id: 'new-default-id', title: 'Default', userId: mockUserId, isDefault: true };
      mockAlbumRepository.create.mockResolvedValue(mockAlbum);

      const result = await service.findOrCreateDefault(mockUserId);

      expect(result).toEqual(mockAlbum);
      expect(albumRepository.create).toHaveBeenCalledWith({
        data: {
          title: 'Default',
          artist: 'Various Artists',
          isDefault: true,
          userId: mockUserId,
        },
      });
    });

    it('should handle race condition during creation', async () => {
      mockAlbumRepository.findDefault.mockResolvedValueOnce(null);
      mockAlbumRepository.create.mockRejectedValue(new Error('Unique constraint failed'));
      const mockAlbum = { id: 'race-winner-id', title: 'Default', userId: mockUserId, isDefault: true };
      mockAlbumRepository.findDefault.mockResolvedValueOnce(mockAlbum);

      const result = await service.findOrCreateDefault(mockUserId);

      expect(result).toEqual(mockAlbum);
      expect(albumRepository.findDefault).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('should return all albums for a specific user with song counts', async () => {
      const mockAlbums = [
        { id: '1', title: 'A1', _count: { tracks: 5 } },
        { id: '2', title: 'A2', _count: { tracks: 0 } },
      ];
      mockAlbumRepository.findMany.mockResolvedValue(mockAlbums);

      const result = await service.findAll(mockUserId);

      expect(result).toHaveLength(2);
      expect(result[0]._count.songs).toBe(5);
      expect(result[1]._count.songs).toBe(0);
      expect(albumRepository.findMany).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        include: { _count: { select: { tracks: true } } },
      });
    });
  });

  describe('findOne', () => {
    it('should return an album if it belongs to the user', async () => {
      const albumId = 'album-1';
      const mockAlbum = { id: albumId, title: 'A1', userId: mockUserId, _count: { tracks: 10 } };
      mockAlbumRepository.findFirst.mockResolvedValue(mockAlbum);

      const result = await service.findOne(mockUserId, albumId);

      expect(result.id).toBe(albumId);
      expect(result._count.songs).toBe(10);
      expect(albumRepository.findFirst).toHaveBeenCalledWith({
        where: { id: albumId, userId: mockUserId },
        include: { _count: { select: { tracks: true } } },
      });
    });

    it('should return null if album does not exist or belong to user', async () => {
      mockAlbumRepository.findFirst.mockResolvedValue(null);
      const result = await service.findOne(mockUserId, 'non-existent');
      expect(result).toBeNull();
    });
  });
});

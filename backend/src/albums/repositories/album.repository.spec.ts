import { Test, TestingModule } from '@nestjs/testing';
import { AlbumRepository } from './album.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('AlbumRepository', () => {
  let repository: AlbumRepository;

  const mockPrismaService = {
    album: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlbumRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AlbumRepository>(AlbumRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create an album', async () => {
      const albumData = { title: 'Test Album', artist: 'Test Artist' };
      const expectedAlbum = { id: '1', ...albumData };
      mockPrismaService.album.create.mockResolvedValue(expectedAlbum);

      const result = await repository.create({ data: albumData });

      expect(result).toEqual(expectedAlbum);
      expect(mockPrismaService.album.create).toHaveBeenCalledWith({
        data: albumData,
      });
    });
  });

  describe('findByTitleAndArtist', () => {
    it('should return an album by title and artist', async () => {
      const title = 'Test Album';
      const artist = 'Test Artist';
      const expectedAlbum = { id: '1', title, artist };
      mockPrismaService.album.findFirst.mockResolvedValue(expectedAlbum);

      const result = await repository.findByTitleAndArtist(title, artist);

      expect(result).toEqual(expectedAlbum);
      expect(mockPrismaService.album.findFirst).toHaveBeenCalledWith({
        where: { title, artist },
      });
    });

    it('should return null if album not found', async () => {
      mockPrismaService.album.findFirst.mockResolvedValue(null);

      const result = await repository.findByTitleAndArtist(
        'Nonexistent',
        'Artist',
      );

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should return an array of albums', async () => {
      const expectedAlbums = [{ id: '1', title: 'Test Album' }];
      mockPrismaService.album.findMany.mockResolvedValue(expectedAlbums);

      const result = await repository.findMany();

      expect(result).toEqual(expectedAlbums);
      expect(mockPrismaService.album.findMany).toHaveBeenCalled();
    });
  });

  describe('findUnique', () => {
    it('should return an album by id', async () => {
      const expectedAlbum = { id: '1', title: 'Test Album' };
      mockPrismaService.album.findUnique.mockResolvedValue(expectedAlbum);

      const result = await repository.findUnique({ where: { id: '1' } });

      expect(result).toEqual(expectedAlbum);
      expect(mockPrismaService.album.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('update', () => {
    it('should update an album', async () => {
      const updateData = { title: 'Updated Album' };
      const expectedAlbum = { id: '1', title: 'Updated Album' };
      mockPrismaService.album.update.mockResolvedValue(expectedAlbum);

      const result = await repository.update({
        where: { id: '1' },
        data: updateData,
      });

      expect(result).toEqual(expectedAlbum);
      expect(mockPrismaService.album.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete an album', async () => {
      const expectedAlbum = { id: '1', title: 'Deleted Album' };
      mockPrismaService.album.delete.mockResolvedValue(expectedAlbum);

      const result = await repository.delete({ where: { id: '1' } });

      expect(result).toEqual(expectedAlbum);
      expect(mockPrismaService.album.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});

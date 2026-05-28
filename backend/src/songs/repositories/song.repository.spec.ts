import { Test, TestingModule } from '@nestjs/testing';
import { SongRepository } from './song.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('SongRepository', () => {
  let repository: SongRepository;

  const mockPrismaService = {
    track: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<SongRepository>(SongRepository);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create a song', async () => {
      const songData = { title: 'Test Song', artist: 'Test Artist' };
      const expectedSong = { id: '1', ...songData };
      mockPrismaService.track.create.mockResolvedValue(expectedSong);

      const result = await repository.create({ data: songData });

      expect(result).toEqual(expectedSong);
      expect(mockPrismaService.track.create).toHaveBeenCalledWith({
        data: songData,
      });
    });
  });

  describe('findMany', () => {
    it('should return an array of songs', async () => {
      const expectedSongs = [{ id: '1', title: 'Test Song' }];
      mockPrismaService.track.findMany.mockResolvedValue(expectedSongs);

      const result = await repository.findMany();

      expect(result).toEqual(expectedSongs);
      expect(mockPrismaService.track.findMany).toHaveBeenCalled();
    });
  });

  describe('findUnique', () => {
    it('should return a song by id', async () => {
      const expectedSong = { id: '1', title: 'Test Song' };
      mockPrismaService.track.findUnique.mockResolvedValue(expectedSong);

      const result = await repository.findUnique({ where: { id: '1' } });

      expect(result).toEqual(expectedSong);
      expect(mockPrismaService.track.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('update', () => {
    it('should update a song', async () => {
      const updateData = { title: 'Updated Song' };
      const expectedSong = { id: '1', title: 'Updated Song' };
      mockPrismaService.track.update.mockResolvedValue(expectedSong);

      const result = await repository.update({
        where: { id: '1' },
        data: updateData,
      });

      expect(result).toEqual(expectedSong);
      expect(mockPrismaService.track.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
    });
  });

  describe('delete', () => {
    it('should delete a song', async () => {
      const expectedSong = { id: '1', title: 'Deleted Song' };
      mockPrismaService.track.delete.mockResolvedValue(expectedSong);

      const result = await repository.delete({ where: { id: '1' } });

      expect(result).toEqual(expectedSong);
      expect(mockPrismaService.track.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});

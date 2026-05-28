import { Test, TestingModule } from '@nestjs/testing';
import { SongService } from './song.service';
import { SongRepository } from './repositories/song.repository';
import { AlbumRepository } from '../albums/repositories/album.repository';
import { getQueueToken } from '@nestjs/bullmq';

describe('SongService', () => {
  let service: SongService;
  let songRepository: SongRepository;
  let albumRepository: AlbumRepository;
  let queue: any;

  const mockSongRepository = {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  const mockAlbumRepository = {
    findMany: jest.fn(),
    create: jest.fn(),
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
          provide: getQueueToken('conversion'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<SongService>(SongService);
    songRepository = module.get<SongRepository>(SongRepository);
    albumRepository = module.get<AlbumRepository>(AlbumRepository);
    queue = module.get(getQueueToken('conversion'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createFromYoutube', () => {
    it('should create a song with a provided albumId', async () => {
      const url = 'https://youtube.com/watch?v=123';
      const title = 'Test Song';
      const artist = 'Test Artist';
      const albumId = 'album-123';

      const mockSong = { id: 'song-123', title, artist, albumId };
      mockSongRepository.create.mockResolvedValue(mockSong);

      const result = await service.createFromYoutube(url, title, artist, albumId);

      expect(result).toEqual(mockSong);
      expect(songRepository.create).toHaveBeenCalledWith({
        data: {
          title,
          artist,
          url: '',
          albumId,
          sourceType: 'youtube',
        },
      });
      expect(queue.add).toHaveBeenCalledWith('convert', { url, songId: 'song-123' });
    });

    it('should fallback to default album if no albumId is provided', async () => {
      const url = 'https://youtube.com/watch?v=123';
      const title = 'Test Song';
      const artist = 'Test Artist';
      const defaultAlbum = { id: 'default-album', title: 'Default' };

      mockAlbumRepository.findMany.mockResolvedValue([defaultAlbum]);
      mockSongRepository.create.mockResolvedValue({ id: 'song-123', title, artist, albumId: defaultAlbum.id });

      const result = await service.createFromYoutube(url, title, artist);

      expect(result.albumId).toBe(defaultAlbum.id);
      expect(albumRepository.findMany).toHaveBeenCalled();
      expect(songRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          albumId: defaultAlbum.id,
        }),
      }));
    });

    it('should create default album if it does not exist', async () => {
      const url = 'https://youtube.com/watch?v=123';
      const title = 'Test Song';
      const artist = 'Test Artist';
      const defaultAlbum = { id: 'new-default-album', title: 'Default' };

      mockAlbumRepository.findMany.mockResolvedValue([]);
      mockAlbumRepository.create.mockResolvedValue(defaultAlbum);
      mockSongRepository.create.mockResolvedValue({ id: 'song-123', title, artist, albumId: defaultAlbum.id });

      await service.createFromYoutube(url, title, artist);

      expect(albumRepository.create).toHaveBeenCalledWith({
        data: { title: 'Default', artist: 'Various Artists' },
      });
    });
  });

  describe('remove', () => {
    it('should delete a song if it exists', async () => {
      const songId = 'song-123';
      mockSongRepository.findUnique.mockResolvedValue({ id: songId });
      mockSongRepository.delete.mockResolvedValue({ id: songId });

      await service.remove(songId);

      expect(songRepository.findUnique).toHaveBeenCalledWith({ where: { id: songId } });
      expect(songRepository.delete).toHaveBeenCalledWith({ where: { id: songId } });
    });

    it('should throw NotFoundException if song does not exist', async () => {
      const songId = 'non-existent';
      mockSongRepository.findUnique.mockResolvedValue(null);

      await expect(service.remove(songId)).rejects.toThrow('Song not found');
    });
  });

  describe('moveToAlbum', () => {
    it('should update the albumId of a song', async () => {
      const songId = 'song-123';
      const albumId = 'new-album-123';
      const updatedSong = { id: songId, albumId };

      mockSongRepository.findUnique.mockResolvedValue({ id: songId });
      mockSongRepository.update.mockResolvedValue(updatedSong);

      const result = await service.moveToAlbum(songId, albumId);

      expect(result).toEqual(updatedSong);
      expect(songRepository.update).toHaveBeenCalledWith({
        where: { id: songId },
        data: { albumId },
      });
    });

    it('should throw NotFoundException if song does not exist', async () => {
      const songId = 'non-existent';
      const albumId = 'album-123';
      mockSongRepository.findUnique.mockResolvedValue(null);

      await expect(service.moveToAlbum(songId, albumId)).rejects.toThrow('Song not found');
    });
  });
});

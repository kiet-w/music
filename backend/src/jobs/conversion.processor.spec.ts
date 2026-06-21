import { Test, TestingModule } from '@nestjs/testing';
import { ConversionProcessor } from './conversion.processor';
import { DownloaderService } from '../downloader/services/downloader.service';
import { StorageService } from '../storage/services/storage.service';
import { PrismaService } from '../prisma/prisma.service';
import { getLoggerToken } from 'nestjs-pino';
import { Job } from 'bullmq';
import * as fs from 'fs';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  createReadStream: jest.fn().mockReturnValue('mock-stream'),
}));

describe('ConversionProcessor', () => {
  let processor: ConversionProcessor;
  let downloaderService: DownloaderService;
  let storageService: StorageService;
  let prisma: PrismaService;

  const mockPinoLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  const mockDownloaderService = {
    download: jest.fn(),
    cleanup: jest.fn(),
  };

  const mockStorageService = {
    uploadStream: jest.fn(),
    getPublicUrl: jest.fn(),
  };

  const mockPrismaService = {
    track: {
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversionProcessor,
        { provide: DownloaderService, useValue: mockDownloaderService },
        { provide: StorageService, useValue: mockStorageService },
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: getLoggerToken(ConversionProcessor.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    processor = module.get<ConversionProcessor>(ConversionProcessor);
    downloaderService = module.get<DownloaderService>(DownloaderService);
    storageService = module.get<StorageService>(StorageService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    const mockJob = {
      data: {
        url: 'https://youtube.com/watch?v=123',
        songId: 'song-123',
        userId: 'user-123',
      },
    } as Job;

    it('should download, upload, update db and cleanup on success', async () => {
      mockDownloaderService.download.mockResolvedValue(undefined);
      mockStorageService.uploadStream.mockResolvedValue('songs/song-123.mp3');
      mockStorageService.getPublicUrl.mockResolvedValue(
        'https://supabase.co/songs/song-123.mp3',
      );
      mockPrismaService.track.update.mockResolvedValue({
        id: 'song-123',
        url: 'https://supabase.co/songs/song-123.mp3',
      });
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      const result = await processor.process(mockJob);

      expect(result).toEqual({
        storagePath: 'songs/song-123.mp3',
        publicUrl: 'https://supabase.co/songs/song-123.mp3',
      });
      expect(downloaderService.download).toHaveBeenCalledWith(
        mockJob.data.url,
        expect.any(String),
      );
      expect(storageService.uploadStream).toHaveBeenCalledWith(
        'mock-stream',
        'music',
        'songs/song-123.mp3',
      );
      expect(prisma.track.update).toHaveBeenCalledWith({
        where: { id: mockJob.data.songId },
        data: { url: 'https://supabase.co/songs/song-123.mp3' },
      } as any);
      expect(downloaderService.cleanup).toHaveBeenCalledWith(
        expect.any(String),
      );
    });

    it('should cleanup temp file and throw if download fails', async () => {
      const error = new Error('Download failed');
      mockDownloaderService.download.mockRejectedValue(error);
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      await expect(processor.process(mockJob)).rejects.toThrow(error);
      expect(downloaderService.cleanup).toHaveBeenCalledWith(
        expect.any(String),
      );
    });
  });
});

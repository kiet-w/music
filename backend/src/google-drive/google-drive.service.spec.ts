import { Test, TestingModule } from '@nestjs/testing';
import { GoogleDriveService } from './google-drive.service';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { StorageService } from '../storage/services/storage.service';
import { SongRepository } from '../songs/repositories/song.repository';
import { AlbumService } from '../albums/album.service';
import { AlbumRepository } from '../albums/repositories/album.repository';
import { EncryptionService } from '../common/services/encryption.service';
import { google } from 'googleapis';
import { UnauthorizedException } from '@nestjs/common';

jest.mock('googleapis', () => {
  const mockOAuth2Client = {
    generateAuthUrl: jest.fn().mockReturnValue('mock-auth-url'),
    getToken: jest.fn().mockResolvedValue({
      tokens: {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expiry_date: 123456789,
      },
    }),
    setCredentials: jest.fn(),
    on: jest.fn(),
  };

  const mockDrive = {
    files: {
      list: jest.fn().mockResolvedValue({
        data: {
          files: [
            { id: 'file-1', name: 'song.mp3', mimeType: 'audio/mpeg' },
          ],
        },
      }),
      get: jest.fn().mockResolvedValue({
        data: {
          id: 'file-1',
          name: 'song.mp3',
          mimeType: 'audio/mpeg',
        },
      }),
    },
  };

  return {
    google: {
      auth: {
        OAuth2: jest.fn().mockImplementation(() => mockOAuth2Client),
      },
      drive: jest.fn().mockImplementation(() => mockDrive),
    },
  };
});

describe('GoogleDriveService', () => {
  let service: GoogleDriveService;
  let prisma: PrismaService;
  let cacheManager: any;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  const mockStorageService = {
    uploadStream: jest.fn().mockResolvedValue('path/to/song.mp3'),
    getPublicUrl: jest.fn().mockResolvedValue('https://supabase/song.mp3'),
  };

  const mockSongRepository = {
    create: jest.fn(),
  };

  const mockAlbumService = {
    findOrCreateDefault: jest.fn().mockResolvedValue({ id: 'default-album' }),
  };

  const mockAlbumRepository = {
    findUnique: jest.fn(),
  };

  const mockEncryptionService = {
    encrypt: jest.fn().mockImplementation((val) => `encrypted:${val}`),
    decrypt: jest.fn().mockImplementation((val) => {
      if (val.startsWith('encrypted:')) {
        return val.replace('encrypted:', '');
      }
      return val;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleDriveService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: StorageService, useValue: mockStorageService },
        { provide: SongRepository, useValue: mockSongRepository },
        { provide: AlbumService, useValue: mockAlbumService },
        { provide: AlbumRepository, useValue: mockAlbumRepository },
        { provide: EncryptionService, useValue: mockEncryptionService },
      ],
    }).compile();

    service = module.get<GoogleDriveService>(GoogleDriveService);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateAuthUrl', () => {
    it('should generate URL and save state in cache', async () => {
      const url = await service.generateAuthUrl('user-123');
      expect(url).toBe('mock-auth-url');
      expect(cacheManager.set).toHaveBeenCalledWith(expect.stringContaining('google_auth_state:'), 'user-123', 300000);
    });
  });

  describe('isConnected', () => {
    it('should return true if user has googleRefreshToken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ googleRefreshToken: 'encrypted:token' });
      const res = await service.isConnected('user-123');
      expect(res).toBe(true);
    });

    it('should return false if user does not have googleRefreshToken', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      const res = await service.isConnected('user-123');
      expect(res).toBe(false);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange code and save encrypted tokens', async () => {
      mockCacheManager.get.mockResolvedValue('user-123');
      const res = await service.exchangeCodeForTokens('user-123', 'code-123', 'state-123');

      expect(res).toEqual({ success: true });
      expect(cacheManager.del).toHaveBeenCalledWith('google_auth_state:state-123');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          googleAccessToken: 'encrypted:access-token',
          googleRefreshToken: 'encrypted:refresh-token',
          googleTokenExpiry: expect.any(Date),
        },
      } as any);
    });

    it('should throw UnauthorizedException if state is invalid', async () => {
      mockCacheManager.get.mockResolvedValue('other-user');
      await expect(service.exchangeCodeForTokens('user-123', 'code-123', 'state-123')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('migrateTokens', () => {
    it('should migrate unencrypted tokens to encrypted ones', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([
        { id: 'user-1', googleRefreshToken: 'plain-token-1', googleAccessToken: 'plain-access-1' },
        { id: 'user-2', googleRefreshToken: 'encrypted:token-2', googleAccessToken: 'encrypted:access-2' },
      ]);

      await service.onModuleInit();

      expect(prisma.user.update).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          googleRefreshToken: 'encrypted:plain-token-1',
          googleAccessToken: 'encrypted:plain-access-1',
        },
      } as any);
    });
  });
});

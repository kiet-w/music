import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ConversionProcessor } from '../src/jobs/conversion.processor';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { JwtService } from '@nestjs/jwt';

describe('SongsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;

  const mockUser = { id: 'user-123', email: 'test@example.com' };

  const mockPrismaService = {
    track: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    album: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockQueue = {
    add: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-1234567890';
    process.env.JWT_EXPIRES_IN = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(getQueueToken('conversion'))
      .useValue(mockQueue)
      .overrideProvider(ConversionProcessor)
      .useValue({})
      .overrideProvider(CACHE_MANAGER)
      .useValue(mockCacheManager)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: mockUser.id, email: mockUser.email });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/songs (GET) - should return all songs for user', async () => {
    const mockSongs = [
      { id: '1', title: 'Song 1', artist: 'Artist 1', url: 'http://link.com' },
    ];
    mockPrismaService.track.findMany.mockResolvedValue(mockSongs);

    return request(app.getHttpServer())
      .get('/songs')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Song 1');
        expect(mockPrismaService.track.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: { album: { userId: mockUser.id } }
        }));
      });
  });

  it('/songs/youtube (POST) - should create a conversion job using default album', async () => {
    const songData = {
      url: 'https://youtube.com/watch?v=123',
      title: 'New Song',
      artist: 'New Artist',
    };
    const mockAlbum = { id: 'album-1', title: 'Default', userId: mockUser.id };
    const mockSong = {
      id: 'song-1',
      ...songData,
      albumId: 'album-1',
      sourceType: 'youtube',
    };

    // findOrCreateDefault logic calls findFirst or findByUserAndTitle
    mockPrismaService.album.findFirst.mockResolvedValue(mockAlbum);
    mockPrismaService.track.create.mockResolvedValue(mockSong);
    mockQueue.add.mockResolvedValue({ id: 'job-1' });

    return request(app.getHttpServer())
      .post('/songs/youtube')
      .set('Authorization', `Bearer ${authToken}`)
      .send(songData)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBe('song-1');
        expect(mockQueue.add).toHaveBeenCalled();
      });
  });

  it('/songs/youtube (POST) - should use provided albumId if owned by user', async () => {
    const songData = {
      url: 'https://youtube.com/watch?v=123',
      title: 'New Song',
      artist: 'New Artist',
      albumId: 'custom-album-id',
    };
    const mockSong = {
      id: 'song-2',
      ...songData,
      sourceType: 'youtube',
    };

    mockPrismaService.album.findUnique.mockResolvedValue({ id: 'custom-album-id', userId: mockUser.id });
    mockPrismaService.track.create.mockResolvedValue(mockSong);
    mockQueue.add.mockResolvedValue({ id: 'job-2' });

    return request(app.getHttpServer())
      .post('/songs/youtube')
      .set('Authorization', `Bearer ${authToken}`)
      .send(songData)
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBe('song-2');
        expect(res.body.albumId).toBe('custom-album-id');
      });
  });

  it('/songs/:id (DELETE) - should delete a song if owned', async () => {
    const songId = 'song-1';
    mockPrismaService.track.findFirst.mockResolvedValue({ id: songId });
    mockPrismaService.track.delete.mockResolvedValue({ id: songId });

    return request(app.getHttpServer())
      .delete(`/songs/${songId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);
  });

  it('/songs/:id/move (PATCH) - should move a song if owned', async () => {
    const songId = 'song-1';
    const albumId = 'new-album-id';
    const updatedSong = { id: songId, albumId };

    mockPrismaService.track.findFirst.mockResolvedValue({ id: songId });
    mockPrismaService.album.findUnique.mockResolvedValue({ id: albumId, userId: mockUser.id });
    mockPrismaService.track.update.mockResolvedValue(updatedSong);

    return request(app.getHttpServer())
      .patch(`/songs/${songId}/move`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ albumId })
      .expect(200)
      .expect((res) => {
        expect(res.body.albumId).toBe(albumId);
      });
  });
});

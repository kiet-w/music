import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AlbumsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let authToken: string;
  let secondAuthToken: string;

  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const secondMockUser = { id: 'user-456', email: 'second@example.com' };

  const mockPrismaService = {
    album: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-1234567890';
    process.env.JWT_EXPIRES_IN = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: mockUser.id, email: mockUser.email });
    secondAuthToken = jwtService.sign({
      sub: secondMockUser.id,
      email: secondMockUser.email,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/albums (GET) - should return 401 if unauthenticated', () => {
    return request(app.getHttpServer())
      .get('/albums')
      .expect(401);
  });

  it('/albums (GET) - should not leak cached albums between users', async () => {
    mockPrismaService.album.findMany
      .mockResolvedValueOnce([
        { id: 'album-user-1', title: 'User 1 Album', userId: mockUser.id },
      ])
      .mockResolvedValueOnce([
        { id: 'album-user-2', title: 'User 2 Album', userId: secondMockUser.id },
      ]);

    await request(app.getHttpServer())
      .get('/albums')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe('album-user-1');
      });

    await request(app.getHttpServer())
      .get('/albums')
      .set('Authorization', `Bearer ${secondAuthToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe('album-user-2');
      });

    expect(mockPrismaService.album.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: { userId: mockUser.id },
      }),
    );
    expect(mockPrismaService.album.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { userId: secondMockUser.id },
      }),
    );
  });

  it('/albums (GET) - should return all albums for the user', async () => {
    const mockAlbums = [{ id: '1', title: 'Album 1', artist: 'Artist 1', userId: mockUser.id }];
    mockPrismaService.album.findMany.mockResolvedValue(mockAlbums);

    return request(app.getHttpServer())
      .get('/albums')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Album 1');
        expect(mockPrismaService.album.findMany).toHaveBeenCalledWith(expect.objectContaining({
          where: { userId: mockUser.id }
        }));
      });
  });

  it('/albums/:id (GET) - should return one album', async () => {
    const mockAlbum = { id: '1', title: 'Album 1', tracks: [], userId: mockUser.id };
    mockPrismaService.album.findFirst.mockResolvedValue(mockAlbum);

    return request(app.getHttpServer())
      .get('/albums/1')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('1');
        expect(mockPrismaService.album.findFirst).toHaveBeenCalledWith(expect.objectContaining({
          where: { id: '1', userId: mockUser.id }
        }));
      });
  });

  it('/albums (POST) - should create an album', async () => {
    const createAlbumDto = { title: 'New Album', artist: 'New Artist' };
    const mockCreatedAlbum = { id: '2', ...createAlbumDto, userId: mockUser.id };
    mockPrismaService.album.create.mockResolvedValue(mockCreatedAlbum);

    return request(app.getHttpServer())
      .post('/albums')
      .set('Authorization', `Bearer ${authToken}`)
      .send(createAlbumDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toBe('New Album');
        expect(res.body.id).toBe('2');
        expect(mockPrismaService.album.create).toHaveBeenCalledWith(expect.objectContaining({
          data: expect.objectContaining({
            userId: mockUser.id
          })
        }));
      });
  });
});

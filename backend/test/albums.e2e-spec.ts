import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AlbumsController (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    album: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeAll(async () => {
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('/albums (GET) - should return all albums', async () => {
    const mockAlbums = [{ id: '1', title: 'Album 1', artist: 'Artist 1' }];
    mockPrismaService.album.findMany.mockResolvedValue(mockAlbums);

    return request(app.getHttpServer())
      .get('/albums')
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveLength(1);
        expect(res.body[0].title).toBe('Album 1');
      });
  });

  it('/albums/:id (GET) - should return one album', async () => {
    const mockAlbum = { id: '1', title: 'Album 1', tracks: [] };
    mockPrismaService.album.findUnique.mockResolvedValue(mockAlbum);

    return request(app.getHttpServer())
      .get('/albums/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('1');
      });
  });

  it('/albums (POST) - should create an album', async () => {
    const createAlbumDto = { title: 'New Album', artist: 'New Artist' };
    const mockCreatedAlbum = { id: '2', ...createAlbumDto };
    mockPrismaService.album.create.mockResolvedValue(mockCreatedAlbum);

    return request(app.getHttpServer())
      .post('/albums')
      .send(createAlbumDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toBe('New Album');
        expect(res.body.id).toBe('2');
      });
  });
});

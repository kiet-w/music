import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('AdminController (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    track: {
      delete: jest.fn(),
    },
  };

  const mockStorageProvider = {
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider('IStorageProvider')
      .useValue(mockStorageProvider)
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

  it('/admin/tracks/:id (DELETE) - should delete a track', async () => {
    mockPrismaService.track.delete.mockResolvedValue({ id: '1' });

    return request(app.getHttpServer())
      .delete('/admin/tracks/1')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('1');
      });
  });

  it('/admin/storage/cleanup (POST) - should initiate cleanup', async () => {
    mockStorageProvider.delete.mockResolvedValue(undefined);

    return request(app.getHttpServer())
      .post('/admin/storage/cleanup')
      .send({ bucketName: 'music', path: 'songs/1.mp3' })
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toContain('Storage cleanup initiated');
        expect(mockStorageProvider.delete).toHaveBeenCalledWith(
          'music',
          'songs/1.mp3',
        );
      });
  });
});

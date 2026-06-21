import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('AdminController (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  const mockPrismaService = {
    track: {
      delete: jest.fn(),
    },
  };

  const mockStorageProvider = {
    delete: jest.fn(),
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret-key-for-e2e-tests-1234567890';
    process.env.JWT_EXPIRES_IN = '1h';

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

    const jwtService = app.get(JwtService);
    adminToken = jwtService.sign({ sub: 'admin-123', email: 'admin@example.com', role: 'ADMIN' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/admin/tracks/:id (DELETE) - should delete a track', async () => {
    mockPrismaService.track.delete.mockResolvedValue({ id: '1' });

    return request(app.getHttpServer())
      .delete('/admin/tracks/1')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe('1');
      });
  });

  it('/admin/storage/cleanup (POST) - should initiate cleanup', async () => {
    mockStorageProvider.delete.mockResolvedValue(undefined);

    return request(app.getHttpServer())
      .post('/admin/storage/cleanup')
      .set('Authorization', `Bearer ${adminToken}`)
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

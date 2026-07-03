import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { getQueueToken } from '@nestjs/bullmq';
import { ConversionProcessor } from './../src/jobs/conversion.processor';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    mockPrismaService.$queryRaw.mockReset();
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideProvider(getQueueToken('conversion'))
      .useValue({
        add: jest.fn(),
      })
      .overrideProvider(ConversionProcessor)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .then((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.timestamp).toBeDefined();
        expect(res.body.uptime).toBeDefined();
        expect(res.body.version).toBeDefined();
      });
  });

  it('/health/ready (GET) - success', () => {
    mockPrismaService.$queryRaw.mockResolvedValue([1]);
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .then((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.checks.database).toBe('ok');
      });
  });

  it('/health/ready (GET) - DB failure', () => {
    mockPrismaService.$queryRaw.mockRejectedValue(
      new Error('Connection failed'),
    );
    return request(app.getHttpServer())
      .get('/health/ready')
      .expect(503)
      .then((res) => {
        expect(res.body.status).toBe('error');
        expect(res.body.checks.database).toBe('error');
      });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});

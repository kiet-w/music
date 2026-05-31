import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
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
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockImplementation(({ data }) => ({
        id: 'user-123',
        email: data.email,
        name: data.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user.passwordHash).toBeUndefined();
        });
    });

    it('should return 409 if email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({ id: '1' });

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login and return a token', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      const passwordHash = await bcrypt.hash(loginDto.password, 12);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginDto.email,
        passwordHash,
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
        });
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const correctPasswordHash = await bcrypt.hash('correctpassword', 12);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginDto.email,
        passwordHash: correctPasswordHash,
      });

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return 401 if no token is provided', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });

    it('should return user profile if token is valid', async () => {
      // First login to get a token
      const loginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const passwordHash = await bcrypt.hash(loginDto.password, 12);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginDto.email,
        passwordHash,
      });

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);

      const token = loginRes.body.accessToken;

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginDto.email,
        name: 'Test User',
      });

      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(loginDto.email);
        });
    });
  });
});

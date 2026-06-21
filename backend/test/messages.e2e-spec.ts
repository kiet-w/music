import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

describe('MessagesController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
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
  });

  afterAll(async () => {
    await app.close();
  });

  const getAuthHeader = (userId: string, email: string) => {
    const token = jwtService.sign({ sub: userId, email });
    return `Bearer ${token}`;
  };

  describe('/messages (POST)', () => {
    it('should send a new message', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const receiverId = '550e8400-e29b-41d4-a716-446655440001';
      const content = 'Hello there!';
      const authHeader = getAuthHeader(userId, 'user1@example.com');

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.message.create.mockImplementation(({ data }) => ({
        id: '550e8400-e29b-41d4-a716-446655440002',
        content: data.content,
        senderId: userId,
        receiverId: data.receiver.connect.id,
        createdAt: new Date(),
      }));

      return request(app.getHttpServer())
        .post('/messages')
        .set('Authorization', authHeader)
        .send({ receiverId, content })
        .expect(201)
        .expect((res) => {
          expect(res.body.content).toBe(content);
          expect(res.body.receiverId).toBe(receiverId);
          expect(res.body.senderId).toBe(userId);
        });
    });

    it('should return 401 if not authenticated', () => {
      return request(app.getHttpServer())
        .post('/messages')
        .send({
          receiverId: '550e8400-e29b-41d4-a716-446655440001',
          content: 'Hi',
        })
        .expect(401);
    });
  });

  describe('/messages/:userId (GET)', () => {
    it('should return chat history', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const otherUserId = '550e8400-e29b-41d4-a716-446655440001';
      const authHeader = getAuthHeader(userId, 'user1@example.com');

      const mockMessages = [
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          content: 'Hi',
          senderId: userId,
          receiverId: otherUserId,
          createdAt: new Date(),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          content: 'Hello!',
          senderId: otherUserId,
          receiverId: userId,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue({ id: userId });
      mockPrismaService.message.findMany.mockResolvedValue(mockMessages);

      return request(app.getHttpServer())
        .get(`/messages/${otherUserId}`)
        .set('Authorization', authHeader)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(2);
          expect(res.body[0].content).toBe('Hi');
          expect(res.body[1].content).toBe('Hello!');
        });
    });
  });
});

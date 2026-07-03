import { Test, TestingModule } from '@nestjs/testing';
import { ServiceUnavailableException } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;
  let prismaService: any;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
    prismaService = app.get<PrismaService>(PrismaService);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      const status = appController.healthCheck();
      expect(status.status).toBe('ok');
      expect(status.timestamp).toBeDefined();
      expect(status.uptime).toBeDefined();
      expect(status.version).toBeDefined();
    });
  });

  describe('readinessCheck', () => {
    it('should return ready status when DB check succeeds', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([1]);

      const status = await appController.readinessCheck();
      expect(status.status).toBe('ok');
      expect(status.checks.database).toBe('ok');
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });

    it('should throw ServiceUnavailableException when DB check fails', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(
        new Error('Connection failed'),
      );

      await expect(appController.readinessCheck()).rejects.toThrow(
        ServiceUnavailableException,
      );
      expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    });
  });
});

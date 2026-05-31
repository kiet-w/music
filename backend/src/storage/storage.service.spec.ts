import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { getLoggerToken } from 'nestjs-pino';

describe('StorageService', () => {
  let service: StorageService;

  const mockPinoLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: getLoggerToken(StorageService.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

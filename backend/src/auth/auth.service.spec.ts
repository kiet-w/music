import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserRepository } from './repositories/user.repository';
import { getLoggerToken, PinoLogger } from 'nestjs-pino';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            findUnique: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: getLoggerToken(AuthService.name),
          useValue: {
            setContext: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if user already exists', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1' });
      await expect(service.register({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com', name: 'Test' });
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      const result = await service.register({ email: 'TEST@example.com', password: 'password', name: 'Test' });
      
      expect(result.accessToken).toBe('token');
      expect(userRepository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'test@example.com',
          passwordHash: expect.any(String),
          name: 'Test',
        }),
      });
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException for invalid credentials', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(service.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const passwordHash = await bcrypt.hash('password', 12);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({ id: '1', passwordHash });
      
      await expect(service.login({ email: 'test@example.com', password: 'wrong' }))
        .rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password', 12);
      const user = { id: '1', email: 'test@example.com', passwordHash, name: 'Test' };
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(user);
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      const result = await service.login({ email: 'test@example.com', password: 'password' });
      
      expect(result.accessToken).toBe('token');
      expect(result.user.email).toBe('test@example.com');
    });
  });
});

import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { getLoggerToken } from 'nestjs-pino';

import { AuthService } from './auth.service';
import { UserRepository } from './repositories/user.repository';

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
            findByGoogleId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
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

      await expect(
        service.register({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and return tokens', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test',
      });
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      const result = await service.register({
        email: 'TEST@example.com',
        password: 'password',
        name: 'Test',
      });

      expect(result.accessToken).toBe('token');
      expect(result.user.email).toBe('test@example.com');
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

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password hash is missing', async () => {
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: null,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'password' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const passwordHash = await bcrypt.hash('password', 12);
      (userRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: '1',
        passwordHash,
      });

      await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should return tokens for valid credentials', async () => {
      const passwordHash = await bcrypt.hash('password', 12);
      const user = {
        id: '1',
        email: 'test@example.com',
        passwordHash,
        name: 'Test',
      };

      (userRepository.findByEmail as jest.Mock).mockResolvedValue(user);
      (jwtService.sign as jest.Mock).mockReturnValue('token');

      const result = await service.login({ email: 'test@example.com', password: 'password' });

      expect(result.accessToken).toBe('token');
      expect(result.user.email).toBe('test@example.com');
    });
  });

  describe('getGoogleStatus', () => {
    it('should return linked false if user has no refresh token', async () => {
      (userRepository.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        googleRefreshToken: null,
      });

      const result = await service.getGoogleStatus('1');

      expect(result).toEqual({ linked: false });
    });

    it('should return linked true and email if user has refresh token', async () => {
      (userRepository.findUnique as jest.Mock).mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        googleRefreshToken: 'token',
      });

      const result = await service.getGoogleStatus('1');

      expect(result).toEqual({ linked: true, email: 'test@example.com' });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      (userRepository.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.getGoogleStatus('1')).rejects.toThrow(UnauthorizedException);
    });
  });
});

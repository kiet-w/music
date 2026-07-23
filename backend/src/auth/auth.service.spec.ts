import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserRepository } from './repositories/user.repository';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { EncryptionService } from '../common/services/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let prismaService: PrismaService;

  const mockUserRepository = {
    findByEmail: jest.fn(),
    findByGoogleId: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMailService = {
    sendVerificationOtp: jest.fn(),
    sendPasswordResetOtp: jest.fn(),
  };

  const mockEncryptionService = {
    encrypt: jest.fn(),
    decrypt: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserRepository,
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({ id: '1', email: 'test@example.com' });

      await expect(
        service.register(
          { email: 'test@example.com', password: 'password123', name: 'Test User' },
          '127.0.0.1',
          'test-agent'
        )
      ).rejects.toThrow(ConflictException);
    });

    it('should create user and send OTP email', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        isEmailVerified: false,
      });
      mockMailService.sendVerificationOtp.mockResolvedValue(undefined);

      const result = await service.register(
        { email: 'test@example.com', password: 'password123', name: 'Test User' },
        '127.0.0.1',
        'test-agent'
      );

      expect(result.requiresVerification).toBe(true);
      expect(mockMailService.sendVerificationOtp).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'test@example.com', password: 'password123' }, '127.0.0.1', 'test-agent')
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        isEmailVerified: true,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }, '127.0.0.1', 'test-agent')
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return tokens', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        verificationOtp: '123456',
        otpExpiresAt: new Date(Date.now() + 600000),
        isEmailVerified: false,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, isEmailVerified: true });
      mockJwtService.signAsync.mockResolvedValue('access_token');

      const result = await service.verifyOtp(
        { email: 'test@example.com', otp: '123456' },
        '127.0.0.1',
        'test-agent'
      );

      expect(result.accessToken).toBeDefined();
    });

    it('should throw BadRequestException if OTP expired', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        verificationOtp: '123456',
        otpExpiresAt: new Date(Date.now() - 600000),
        isEmailVerified: false,
      };

      mockUserRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.verifyOtp({ email: 'test@example.com', otp: '123456' }, '127.0.0.1', 'test-agent')
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('me', () => {
    it('should return user info', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        role: 'USER',
      };

      mockUserRepository.findUnique.mockResolvedValue(mockUser);

      const result = await service.me('1');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: null,
        role: 'USER',
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUserRepository.findUnique.mockResolvedValue(null);

      await expect(service.me('nonexistent')).rejects.toThrow(UnauthorizedException);
    });
  });
});
# Auth Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement authentication and authorization in the NestJS backend using JWT and Bcrypt.

**Architecture:** NestJS Module with Controller, Service, and Repository. Uses `@nestjs/jwt` for token management and `bcryptjs` for password hashing. Follows the Repository pattern for database access.

**Tech Stack:** NestJS, Prisma, JWT, Bcrypt, class-validator, PinoLogger.

---

### Task 1: Auth DTOs

**Files:**
- Create: `src/auth/dto/register.dto.ts`
- Create: `src/auth/dto/login.dto.ts`
- Create: `src/auth/dto/auth-response.dto.ts`

- [ ] **Step 1: Create `register.dto.ts`**
```typescript
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}
```

- [ ] **Step 2: Create `login.dto.ts`**
```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

- [ ] **Step 3: Create `auth-response.dto.ts`**
```typescript
export type AuthResponseDto = {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
  };
};
```

### Task 2: User Repository

**Files:**
- Create: `src/auth/repositories/user.repository.ts`
- Create: `src/auth/repositories/user.repository.spec.ts`

- [ ] **Step 1: Write failing test for UserRepository**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { PrismaService } from '../../prisma/prisma.service';

describe('UserRepository', () => {
  let repository: UserRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRepository,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    repository = module.get<UserRepository>(UserRepository);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should find user by email', async () => {
    const email = 'test@example.com';
    const mockUser = { id: '1', email };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    const result = await repository.findByEmail(email);
    expect(result).toEqual(mockUser);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email } });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test src/auth/repositories/user.repository.spec.ts`

- [ ] **Step 3: Implement UserRepository**
```typescript
import { Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class UserRepository extends BaseRepository<User, Prisma.UserDelegate> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test src/auth/repositories/user.repository.spec.ts`

- [ ] **Step 5: Commit**
```bash
git add src/auth/repositories/user.repository.ts src/auth/repositories/user.repository.spec.ts
git commit -m "feat(auth): add user repository"
```

### Task 3: Auth Service

**Files:**
- Create: `src/auth/auth.service.ts`
- Test: `src/auth/auth.service.spec.ts`

- [ ] **Step 1: Write failing test for AuthService**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { UserRepository } from './repositories/user.repository';
import { PinoLogger } from 'nestjs-pino';

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
          provide: PinoLogger,
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
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test src/auth/auth.service.spec.ts`

- [ ] **Step 3: Implement AuthService**
```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserRepository } from './repositories/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.info({ email }, 'Registration failed: email already exists');
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.userRepository.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
      },
    });

    this.logger.info({ userId: user.id }, 'User registered successfully');
    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async me(userId: string) {
    const user = await this.userRepository.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test src/auth/auth.service.spec.ts`

- [ ] **Step 5: Commit**
```bash
git add src/auth/auth.service.ts src/auth/auth.service.spec.ts
git commit -m "feat(auth): implement auth service"
```

### Task 4: JWT Guard and Current User Decorator

**Files:**
- Create: `src/auth/jwt-auth.guard.ts`
- Create: `src/auth/current-user.decorator.ts`
- Create: `src/auth/jwt-auth.guard.spec.ts`

- [ ] **Step 1: Write failing test for JwtAuthGuard**
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should throw UnauthorizedException if no token provided', async () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException if token invalid', async () => {
    (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error());
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: 'Bearer invalid' } }),
      }),
    } as ExecutionContext;

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should populate request.user if token valid', async () => {
    const payload = { sub: '1', email: 'test@example.com' };
    (jwtService.verifyAsync as jest.Mock).mockResolvedValue(payload);
    const request = { headers: { authorization: 'Bearer valid' } };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(request['user']).toEqual({ id: '1', email: 'test@example.com' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `npm test src/auth/jwt-auth.guard.spec.ts`

- [ ] **Step 3: Implement JwtAuthGuard**
```typescript
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request['user'] = { id: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

- [ ] **Step 4: Implement CurrentUser decorator**
```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

- [ ] **Step 5: Run test to verify it passes**
Run: `npm test src/auth/jwt-auth.guard.spec.ts`

- [ ] **Step 6: Commit**
```bash
git add src/auth/jwt-auth.guard.ts src/auth/current-user.decorator.ts src/auth/jwt-auth.guard.spec.ts
git commit -m "feat(auth): add jwt guard and current user decorator"
```

### Task 5: Auth Controller and Module

**Files:**
- Create: `src/auth/auth.controller.ts`
- Create: `src/auth/auth.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Implement AuthController**
```typescript
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from './current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.authService.me(user.id);
  }
}
```

- [ ] **Step 2: Implement AuthModule**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from './repositories/user.repository';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '1d'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserRepository],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

- [ ] **Step 3: Update AppModule**
Include `AuthModule` and `ConfigModule` in `src/app.module.ts`.

- [ ] **Step 4: Commit**
```bash
git add src/auth/auth.controller.ts src/auth/auth.module.ts src/app.module.ts
git commit -m "feat(auth): add auth controller and module"
```

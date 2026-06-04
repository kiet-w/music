import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserRepository } from './repositories/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  async googleLogin(idToken: string): Promise<AuthResponseDto> {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const { sub: googleId, email, name, picture } = payload;
      if (!email) {
        throw new UnauthorizedException('Google account must have an email');
      }

      let user = await this.userRepository.findByGoogleId(googleId);

      if (!user) {
        // Check by email to see if we should link
        user = await this.userRepository.findByEmail(email.toLowerCase());
        if (user) {
          // Link Google account to existing email account
          user = await this.userRepository.update({
            where: { id: user.id },
            data: { googleId },
          });
          this.logger.info({ userId: user.id }, 'Linked Google ID to existing user');
        } else {
          // Create new user
          user = await this.userRepository.create({
            data: {
              email: email.toLowerCase(),
              name,
              googleId,
            },
          });
          this.logger.info({ userId: user.id }, 'Created new user via Google login');
        }
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
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Google login failed');
      throw new UnauthorizedException('Google authentication failed');
    }
  }

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

  async findAll() {
    return this.userRepository.findMany({
      select: {
        id: true,
        email: true,
        name: true,
      },
    });
  }
}

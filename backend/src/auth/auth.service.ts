import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { User } from '@prisma/client';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { UserRepository } from './repositories/user.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from '../mail/mail.service';
import { EncryptionService } from '../common/services/encryption.service';
import { randomBytes, randomUUID, createHash, randomInt } from 'crypto';
import * as argon2 from 'argon2';
import { PrismaService } from 'src/prisma/prisma.service';
import { RefreshToken } from '@prisma/client';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly encryptionService: EncryptionService,
    private readonly mailService: MailService,
    @InjectPinoLogger(AuthService.name)
    private readonly logger: PinoLogger,
    private readonly prisma: PrismaService
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  private generateOtp(): string {
    return randomInt(100000, 1000000).toString();
  }

  // ─── Public Methods ───────────────────────────────────────────

  async register(dto: RegisterDto, ip: string, userAgent: string): Promise<any> {
    const email = dto.email.toLowerCase();
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      this.logger.info({ email }, 'Registration failed: email already exists');
      throw new ConflictException('Email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);
    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        name: dto.name,
        isEmailVerified: false,
        verificationOtp: otp,
        otpExpiresAt,
      },
    });

    this.logger.info({ userId: user.id }, 'User registered successfully, sending verification OTP');
    await this.mailService.sendVerificationOtp(email, otp);

    return {
      message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực OTP.',
      email: user.email,
      requiresVerification: true,
      otp,
    };
  }

  async verifyOtp(dto: VerifyOtpDto, ip: string, userAgent: string): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('Tài khoản đã được xác thực trước đó');
    }
    if (!user.verificationOtp || user.verificationOtp !== dto.otp) {
      throw new BadRequestException('Mã OTP không chính xác');
    }
    if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã.');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationOtp: null,
        otpExpiresAt: null,
      },
    });

    const family = randomUUID();
    return this.issueToken(updatedUser, ip, userAgent, family);
  }

  async resendOtp(dto: ResendOtpDto): Promise<{ message: string; otp?: string }> {
    const email = dto.email.toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Email không tồn tại');
    }
    if (user.isEmailVerified) {
      throw new BadRequestException('Email này đã được xác thực');
    }

    const otp = this.generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { verificationOtp: otp, otpExpiresAt },
    });

    await this.mailService.sendVerificationOtp(email, otp);
    return { message: 'Đã gửi lại mã OTP xác nhận tới email của bạn.', otp };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; otp?: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Return success to avoid email enumeration
      return { message: 'Nếu email tồn tại trong hệ thống, bạn sẽ nhận được mã OTP đặt lại mật khẩu.' };
    }

    const otp = this.generateOtp();
    const resetPasswordOtpExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordOtp: otp,
        resetPasswordOtpExpiresAt,
      },
    });

    await this.mailService.sendPasswordResetOtp(email, otp);
    return { message: 'Mã OTP đặt lại mật khẩu đã được gửi tới email của bạn.', otp };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      throw new BadRequestException('Yêu cầu không hợp lệ');
    }
    if (!user.resetPasswordOtp || user.resetPasswordOtp !== dto.otp) {
      throw new BadRequestException('Mã OTP không chính xác');
    }
    if (user.resetPasswordOtpExpiresAt && new Date() > user.resetPasswordOtpExpiresAt) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu lại.');
    }

    const newPasswordHash = await argon2.hash(dto.newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetPasswordOtp: null,
        resetPasswordOtpExpiresAt: null,
      },
    });

    return { message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.' };
  }

  async login(dto: LoginDto, ip: string, userAgent: string): Promise<AuthResponseDto> {
    const email = dto.email.trim().toLowerCase();
    const user = await this.userRepository.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }

    let isPasswordValid = false;
    try {
      if (user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$')) {
        const bcrypt = require('bcryptjs');
        isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
      } else {
        isPasswordValid = await argon2.verify(user.passwordHash, dto.password);
      }
    } catch {
      isPasswordValid = false;
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException('Thông tin đăng nhập không chính xác');
    }
    if (!user.isEmailVerified && !user.googleId) {
      throw new UnauthorizedException('Tài khoản chưa được xác thực email. Vui lòng xác thực mã OTP trước.');
    }
    const family = randomUUID();

    return this.issueToken(user, ip, userAgent, family);
  }

  async refresh(refreshToken: string, ip: string, userAgent: string): Promise<AuthResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.isRevoked) {
      // Refresh Token reuse detected
      await this.prisma.refreshToken.updateMany({
        where: { family: storedToken.family },
        data: { isRevoked: true },
      });
      this.logger.warn({ userId: storedToken.userId, family: storedToken.family }, 'Attempted use of revoked refresh token, family revoked');
      throw new UnauthorizedException('Token revoked');
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true },
    });

    return this.issueToken(storedToken.user, ip, userAgent, storedToken.family);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    if (!refreshToken) return;
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (storedToken) {
      await this.prisma.refreshToken.updateMany({
        where: { family: storedToken.family },
        data: { isRevoked: true },
      });
      this.logger.info({ userId: storedToken.userId, family: storedToken.family }, 'Refresh token family revoked via logout');
    }
  }

  async googleLogin(idToken: string, ip: string, userAgent: string): Promise<AuthResponseDto> {
    try {
      const { googleId, email, name } = await this.verifyGoogleToken(idToken);
      const user = await this.findOrCreateGoogleUser(googleId, email, name);
      const family = randomUUID();
      return this.issueToken(user, ip, userAgent, family);
    } catch (error: any) {
      this.logger.error({ error: error.message }, 'Google login failed');
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async googleUnifiedLogin(
    code: string,
    ip: string,
    userAgent: string,
    redirectUri?: string,
  ): Promise<AuthResponseDto> {
    try {
      const client = redirectUri
        ? new OAuth2Client(
            this.configService.get<string>('GOOGLE_CLIENT_ID'),
            this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
            redirectUri,
          )
        : this.googleClient;

      const { tokens } = await client.getToken(code);
      if (!tokens.id_token) {
        throw new UnauthorizedException('No ID Token received from Google');
      }

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) {
        throw new UnauthorizedException('Invalid ID Token payload');
      }

      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name;

      const user = await this.findOrCreateGoogleUser(googleId, email, name);

      // Save tokens to user
      const updatedUser = await this.userRepository.update({
        where: { id: user.id },
        data: {
          googleAccessToken: tokens.access_token
            ? this.encryptionService.encrypt(tokens.access_token)
            : null,
          googleRefreshToken: tokens.refresh_token
            ? this.encryptionService.encrypt(tokens.refresh_token)
            : null,
          googleTokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : null,
        },
      });

      const family = randomUUID();
      return this.issueToken(updatedUser, ip, userAgent, family);
    } catch (error: any) {
      this.logger.error(
        { error: error.message },
        'Unified Google login failed',
      );
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async me(userId: string) {
    const user = await this.userRepository.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, name: user.name };
  }

  async getGoogleStatus(
    userId: string,
  ): Promise<{ linked: boolean; email?: string }> {
    const user = await this.userRepository.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return {
      linked: !!user.googleRefreshToken,
      email: user.googleRefreshToken ? user.email : undefined,
    };
  }

  async findAll(skip: number = 0, take: number = 50) {
    const [total, data] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.findMany({
        skip,
        take,
        select: { id: true, email: true, name: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  // ─── Private Helpers ──────────────────────────────────────────
  private async verifyGoogleToken(idToken: string) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Invalid Google token');

    const { sub: googleId, email, name } = payload;
    if (!email)
      throw new UnauthorizedException('Google account must have an email');

    return { googleId, email, name };
  }

  private async findOrCreateGoogleUser(
    googleId: string,
    email: string,
    name?: string,
  ): Promise<User> {
    let user = await this.userRepository.findByGoogleId(googleId);
    if (user) return user;

    user = await this.userRepository.findByEmail(email.toLowerCase());
    if (user) {
      user = await this.userRepository.update({
        where: { id: user.id },
        data: { googleId },
      });
      this.logger.info(
        { userId: user.id },
        'Linked Google ID to existing user',
      );
      return user;
    }

    user = await this.userRepository.create({
      data: { email: email.toLowerCase(), name, googleId },
    });
    this.logger.info({ userId: user.id }, 'Created new user via Google login');
    return user;
  }

  private async issueToken(
    user: User,
    ip: string,
    userAgent: string,
    family: string,
  ): Promise<AuthResponseDto> {
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '15m';
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: expiresIn as any },
    );
    const refreshToken = randomBytes(64).toString('hex');
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    try {
      await this.prisma.refreshToken.create({
        data: {
          tokenHash,
          family,
          ip,
          userAgent,
          expiresAt,
          userId: user.id,
        },
      });
    } catch (e: any) {
      this.logger.warn({ error: e?.message }, 'Failed to persist refresh token, returning access token safely');
    }
    return {
      accessToken,
      refreshToken,
      refreshTokenId: saveToken.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}

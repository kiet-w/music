import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  Query,
  Req,
  Res,
  Ip,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { GoogleUnifiedLoginDto } from './dto/google-unified-login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { Request,Response } from 'express';

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto, @Ip() ip: string, @Headers('user-agent') userAgent: string, @Res({ passthrough: true }) res: Response): Promise<AuthResponseDto> {
    const result = await this.authService.register(registerDto, ip, userAgent);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });
    return { accessToken: result.accessToken, user: result.user };
  }
 
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Ip() ip: string, @Headers('user-agent') userAgent: string, @Res({ passthrough: true }) res: Response): Promise<AuthResponseDto> {
    const result = await this.authService.login(loginDto, ip, userAgent);
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string
  ): Promise<AuthResponseDto> {
    const refreshToken = req.cookies?.['refreshToken'];
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }
    const result = await this.authService.refresh(refreshToken, ip, userAgent);
    
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/auth/refresh',
    });
    return { accessToken: result.accessToken, user: result.user };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refreshToken'];
    if (refreshToken) {
      await this.authService.revokeRefreshToken(refreshToken);
    }
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return { message: 'Logged out' };
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Google' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in with Google',
  })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleLogin(
    @Body() googleLoginDto: GoogleLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.googleLogin(googleLoginDto.idToken);
  }

  @Post('google-unified')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and Sync Google Drive with Unified SSO' })
  @ApiResponse({
    status: 200,
    description: 'User successfully logged in with Google and synced Drive',
  })
  @ApiResponse({ status: 401, description: 'Google authentication failed' })
  async googleUnifiedLogin(
    @Body() googleUnifiedLoginDto: GoogleUnifiedLoginDto,
  ): Promise<AuthResponseDto> {
    return this.authService.googleUnifiedLogin(
      googleUnifiedLoginDto.code,
      googleUnifiedLoginDto.redirectUri,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Return current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.me(user.id);
  }

  @Get('google/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check Google Drive link status' })
  async googleStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getGoogleStatus(user.id);
  }

  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const skip =
      page && limit ? (parseInt(page, 10) - 1) * parseInt(limit, 10) : 0;
    const take = Math.min(limit ? parseInt(limit, 10) : 50, 100); // cap at 100
    return this.authService.findAll(skip, take);
  }
  

  

}

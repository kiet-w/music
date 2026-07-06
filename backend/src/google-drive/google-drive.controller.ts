import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { GoogleDriveService } from './google-drive.service';
import { ImportDto } from './dto/import.dto';
import { ExchangeCodeDto } from './dto/exchange-code.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ThrottlerGuard } from '@nestjs/throttler';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';

@ApiTags('google-drive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('google-drive')
export class GoogleDriveController {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    @InjectPinoLogger(GoogleDriveController.name)
    private readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Get('ping')
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '2.0-debug',
    };
  }

  @Get('status')
  @ApiOperation({ summary: 'Check if Google Drive is connected' })
  async getStatus(@CurrentUser() user: AuthenticatedUser) {
    const cacheKey = `gdrive-status-${user.id}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached !== undefined) {
      return { connected: cached };
    }

    const connected = await this.googleDriveService.isConnected(user.id);
    await this.cacheManager.set(cacheKey, connected, 300000); // 5 minutes cache
    return { connected };
  }

  @Get('auth-url')
  @ApiOperation({ summary: 'Generate Google OAuth URL' })
  async getAuthUrl(@CurrentUser() user: AuthenticatedUser) {
    const url = await this.googleDriveService.generateAuthUrl(user.id);
    return { url };
  }

  @Post('exchange-code')
  @ApiOperation({ summary: 'Exchange Google OAuth code for tokens' })
  async exchangeCode(@CurrentUser() user: AuthenticatedUser, @Body() dto: ExchangeCodeDto) {
    return await this.googleDriveService.exchangeCodeForTokens(
      user.id,
      dto.code,
      dto.state,
    );
  }

  @Get('files')
  @ApiOperation({ summary: 'List music files from Google Drive' })
  async listFiles(@CurrentUser() user: AuthenticatedUser) {
    return await this.googleDriveService.listFiles(user.id);
  }

  @Post('import')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Import a file from Google Drive' })
  async importFile(@CurrentUser() user: AuthenticatedUser, @Body() importDto: ImportDto) {
    return await this.googleDriveService.importFile(user.id, importDto);
  }
}

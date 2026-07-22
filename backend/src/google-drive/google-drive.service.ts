import {
  Injectable,
  UnauthorizedException,
  Inject,
  BadRequestException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { randomUUID } from 'crypto';
import { StorageService } from '../storage/services/storage.service';
import { SongRepository } from '../songs/repositories/song.repository';
import { AlbumService } from '../albums/album.service';
import { AlbumRepository } from '../albums/repositories/album.repository';
import { ImportDto } from './dto/import.dto';
import { EncryptionService } from '../common/services/encryption.service';

@Injectable()
export class GoogleDriveService implements OnModuleInit {
  private oauth2Client: InstanceType<typeof google.auth.OAuth2>;

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly storageService: StorageService,
    private readonly songRepository: SongRepository,
    private readonly albumService: AlbumService,
    private readonly albumRepository: AlbumRepository,
    private readonly encryptionService: EncryptionService,
    private readonly configService: ConfigService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    );
  }

  async generateAuthUrl(userId: string) {
    const state = randomUUID();
    // Store state with userId in cache for 5 minutes
    await this.cacheManager.set(`google_auth_state:${state}`, userId, 300000);

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: ['https://www.googleapis.com/auth/drive.readonly'],
      state: state,
    });
  }

  async isConnected(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { googleRefreshToken: true },
    });
    return !!user?.googleRefreshToken;
  }

  async exchangeCodeForTokens(userId: string, code: string, state: string) {
    const cachedUserId = await this.cacheManager.get(
      `google_auth_state:${state}`,
    );
    if (!cachedUserId || cachedUserId !== userId) {
      throw new UnauthorizedException('Invalid or expired state parameter');
    }

    const { tokens } = await this.oauth2Client.getToken(code);

    // Clear state from cache
    await this.cacheManager.del(`google_auth_state:${state}`);

    // Save tokens to user
    await this.prisma.user.update({
      where: { id: userId },
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

    return { success: true };
  }

  async importFile(userId: string, importDto: ImportDto) {
    const { fileId, albumId, fileName, driveToken } = importDto;

    // 1. Resolve Album
    const finalAlbumId = await this.resolveAlbumId(userId, albumId);

    // 2. Get Metadata & Validate
    const metadata = await this.getFileMetadata(userId, fileId, driveToken);
    this.validateMp3(metadata, fileName);

    // 3. Download
    const stream = await this.downloadFile(userId, fileId, driveToken);

    // 4. Sanitize & Upload
    const originalName = fileName || metadata.name || 'unknown';
    const sanitizedName = this.sanitizeFileName(originalName);
    const storagePath = `songs/${finalAlbumId}/${Date.now()}_${sanitizedName}`;

    const path = await this.storageService.uploadStream(
      stream,
      'music',
      storagePath,
      metadata.mimeType || 'audio/mpeg',
    );
    const url = await this.storageService.getPublicUrl('music', path);

    // 5. Save to DB
    return this.songRepository.create({
      data: {
        title: originalName.replace(/\.[^/.]+$/, ''),
        artist: 'Unknown Artist',
        url,
        albumId: finalAlbumId,
        userId,
        sourceType: 'google-drive',
        sourceId: fileId,
      },
    });
  }

  private async resolveAlbumId(
    userId: string,
    albumId?: string,
  ): Promise<string> {
    if (albumId) {
      const album = await this.albumRepository.findOneForUser(albumId, userId);
      if (!album) {
        throw new NotFoundException('Album not found');
      }
      return album.id;
    }
    const defaultAlbum = await this.albumService.findOrCreateDefault(userId);
    return defaultAlbum.id;
  }

  private validateMp3(metadata: any, fileName?: string) {
    const isMp3Mime =
      metadata.mimeType === 'audio/mpeg' || metadata.mimeType === 'audio/mp3';
    const isMp3Ext = (fileName || metadata.name)
      ?.toLowerCase()
      .endsWith('.mp3');

    if (!isMp3Mime && !isMp3Ext) {
      throw new BadRequestException('Chỉ hỗ trợ file định dạng MP3');
    }
  }

  private sanitizeFileName(name: string): string {
    return name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9.-]/g, '_');
  }

  async listFiles(userId: string) {
    await this.setCredentials(userId);
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const res = await drive.files.list({
      pageSize: 100,
      fields:
        'nextPageToken, files(id, name, mimeType, size, shortcutDetails, capabilities, driveId)',
      q: "trashed = false and (mimeType = 'audio/mpeg' or mimeType = 'application/vnd.google-apps.shortcut')",
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    });

    const files = res.data.files || [];

    // Strictly filter for MP3 files or shortcuts to MP3 files
    const musicFiles = files.filter((file) => {
      const name = file.name?.toLowerCase() || '';
      const mime = file.mimeType?.toLowerCase() || '';
      const isMp3Mime = mime === 'audio/mpeg' || mime === 'audio/mp3';
      const isMp3Ext = name.endsWith('.mp3');

      const isShortcutToMp3 =
        mime === 'application/vnd.google-apps.shortcut' &&
        (file.shortcutDetails?.targetMimeType === 'audio/mpeg' ||
          file.shortcutDetails?.targetMimeType === 'audio/mp3' ||
          name.endsWith('.mp3'));

      return isMp3Mime || isMp3Ext || isShortcutToMp3;
    });

    // Map shortcuts to their targets
    return musicFiles.map((file) => {
      if (
        file.mimeType === 'application/vnd.google-apps.shortcut' &&
        file.shortcutDetails?.targetId
      ) {
        return {
          ...file,
          id: file.shortcutDetails.targetId,
          mimeType: file.shortcutDetails.targetMimeType || 'audio/mpeg',
          isShortcut: true,
        };
      }
      return file;
    });
  }

  async getFileMetadata(userId: string, fileId: string, accessToken?: string) {
    if (accessToken) {
      this.oauth2Client.setCredentials({ access_token: accessToken });
    } else {
      await this.setCredentials(userId);
    }
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    const res = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, size',
      supportsAllDrives: true,
    });
    return res.data;
  }

  async downloadFile(
    userId: string,
    fileId: string,
    accessToken?: string,
  ): Promise<any> {
    if (accessToken) {
      this.oauth2Client.setCredentials({ access_token: accessToken });
    } else {
      await this.setCredentials(userId);
    }
    const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

    const res = await drive.files.get(
      {
        fileId,
        alt: 'media',
        supportsAllDrives: true,
        acknowledgeAbuse: true,
      },
      { responseType: 'stream' },
    );
    return res.data;
  }

  private async setCredentials(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.googleRefreshToken) {
      throw new UnauthorizedException('Google Drive not connected');
    }

    const decryptedRefreshToken = this.encryptionService.decrypt(
      user.googleRefreshToken,
    );
    const decryptedAccessToken = user.googleAccessToken
      ? this.encryptionService.decrypt(user.googleAccessToken)
      : undefined;

    this.oauth2Client.setCredentials({
      refresh_token: decryptedRefreshToken,
      access_token: decryptedAccessToken,
      expiry_date: user.googleTokenExpiry?.getTime(),
    });

    // Handle token refresh automatically by the library
    this.oauth2Client.removeAllListeners('tokens');
    this.oauth2Client.on('tokens', async (tokens) => {
      try {
        if (tokens.refresh_token) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              googleRefreshToken: this.encryptionService.encrypt(
                tokens.refresh_token,
              ),
            },
          });
        }
        if (tokens.access_token) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              googleAccessToken: this.encryptionService.encrypt(
                tokens.access_token,
              ),
              googleTokenExpiry: tokens.expiry_date
                ? new Date(tokens.expiry_date)
                : null,
            },
          });
        }
      } catch (error) {
        // Log but don't throw — this runs in an event handler where
        // unhandled rejections would crash the process.
        console.error(
          `Failed to persist refreshed Google tokens for user ${userId}:`,
          error instanceof Error ? error.message : error,
        );
      }
    });
  }

  async onModuleInit() {
    await this.migrateTokens();
  }

  private async migrateTokens() {
    if (!this.prisma?.user?.findMany) {
      return;
    }

    const users = await this.prisma.user.findMany({
      where: {
        googleRefreshToken: { not: null },
      },
      select: {
        id: true,
        googleRefreshToken: true,
        googleAccessToken: true,
      },
    });

    for (const user of users) {
      try {
        let updated = false;
        const updateData: any = {};

        if (user.googleRefreshToken && !user.googleRefreshToken.includes(':')) {
          updateData.googleRefreshToken = this.encryptionService.encrypt(
            user.googleRefreshToken,
          );
          updated = true;
        }
        if (user.googleAccessToken && !user.googleAccessToken.includes(':')) {
          updateData.googleAccessToken = this.encryptionService.encrypt(
            user.googleAccessToken,
          );
          updated = true;
        }

        if (updated) {
          await this.prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        }
      } catch (error) {
        console.error(
          `Failed to migrate tokens for user ${user.id}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }
}

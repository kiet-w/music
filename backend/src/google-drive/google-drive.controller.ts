import { Controller, Get, Post, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { GoogleDriveService } from './google-drive.service';
import { StorageService } from '../storage/storage.service';
import { SongRepository } from '../songs/repositories/song.repository';
import { AlbumService } from '../albums/album.service';
import { AlbumRepository } from '../albums/repositories/album.repository';
import { ImportDto } from './dto/import.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('google-drive')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('google-drive')
export class GoogleDriveController {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly storageService: StorageService,
    private readonly songRepository: SongRepository,
    private readonly albumService: AlbumService,
    private readonly albumRepository: AlbumRepository,
    @InjectPinoLogger(GoogleDriveController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Get('ping')
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString(), version: '2.0-debug' };
  }

  @Get('files')
  @ApiOperation({ summary: 'List music files from Google Drive' })
  async listFiles(@CurrentUser() user: any, @Query('token') token: string) {
    try {
      return await this.googleDriveService.listFiles(token);
    } catch (error: any) {
      this.logger.error({ userId: user.id, error: error.message }, 'Error in listFiles controller');
      return {
        error: true,
        message: error.message,
        details: error.response?.data || error,
      };
    }
  }

  @Post('import')
  @ApiOperation({ summary: 'Import a file from Google Drive' })
  async importFile(@CurrentUser() user: any, @Body() importDto: ImportDto) {
    const { fileId, accessToken, albumId } = importDto;
    let finalAlbumId = albumId;

    if (finalAlbumId) {
      const album = await this.albumRepository.findUnique({
        where: { id: finalAlbumId },
      });
      if (!album || album.userId !== user.id) {
        throw new NotFoundException('Album not found');
      }
    } else {
      const defaultAlbum = await this.albumService.findOrCreateDefault(user.id);
      finalAlbumId = defaultAlbum.id;
    }

    const metadata = await this.googleDriveService.getFileMetadata(
      accessToken,
      fileId,
    );
    const stream = await this.googleDriveService.downloadFile(
      accessToken,
      fileId,
    );

    // Làm sạch tên file để upload lên Storage (bỏ dấu, ký tự đặc biệt)
    const originalName = metadata.name || 'unknown';
    const sanitizedName = originalName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
      .replace(/[^a-zA-Z0-9.-]/g, '_'); // Thay ký tự đặc biệt bằng dấu gạch dưới

    const storagePath = `songs/${finalAlbumId}/${Date.now()}_${sanitizedName}`;
    const path = await this.storageService.uploadStream(
      stream,
      'music',
      storagePath,
      metadata.mimeType || 'audio/mpeg',
    );
    const url = await this.storageService.getPublicUrl('music', path);

    return this.songRepository.create({
      data: {
        title: originalName.replace(/\.[^/.]+$/, ''), // Giữ nguyên tên gốc có dấu cho DB
        artist: 'Unknown Artist',
        url,
        albumId: finalAlbumId,
        sourceType: 'google-drive',
        sourceId: fileId,
      },
    });
  }
}

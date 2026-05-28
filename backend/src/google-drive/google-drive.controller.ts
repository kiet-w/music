import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { GoogleDriveService } from './google-drive.service';
import { StorageService } from '../storage/storage.service';
import { SongRepository } from '../songs/repositories/song.repository';
import { ImportDto } from './dto/import.dto';

@Controller('google-drive')
export class GoogleDriveController {
  constructor(
    private readonly googleDriveService: GoogleDriveService,
    private readonly storageService: StorageService,
    private readonly songRepository: SongRepository,
  ) {}

  @Get('ping')
  ping() {
    return { status: 'ok', timestamp: new Date().toISOString(), version: '2.0-debug' };
  }

  @Get('files')
  async listFiles(@Query('token') token: string) {
    try {
      return await this.googleDriveService.listFiles(token);
    } catch (error: any) {
      console.error('Error in listFiles controller:', error);
      return {
        error: true,
        message: error.message,
        details: error.response?.data || error,
        stack: error.stack
      };
    }
  }

  @Post('import')
  async importFile(@Body() importDto: ImportDto) {
    const { fileId, accessToken, albumId } = importDto;
    const metadata = await this.googleDriveService.getFileMetadata(
      accessToken,
      fileId,
    );
    const buffer = await this.googleDriveService.downloadFile(
      accessToken,
      fileId,
    );

    // Làm sạch tên file để upload lên Storage (bỏ dấu, ký tự đặc biệt)
    const originalName = metadata.name || 'unknown';
    const sanitizedName = originalName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Bỏ dấu tiếng Việt
      .replace(/[^a-zA-Z0-9.-]/g, '_'); // Thay ký tự đặc biệt bằng dấu gạch dưới

    const storagePath = `songs/${albumId}/${Date.now()}_${sanitizedName}`;
    const path = await this.storageService.uploadBuffer(
      buffer,
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
        albumId,
        sourceType: 'google-drive',
        sourceId: fileId,
      },
    });
  }
}

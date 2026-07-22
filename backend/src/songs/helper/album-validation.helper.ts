import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { AlbumRepository } from '../../albums/repositories/album.repository';
import { AlbumService } from '../../albums/album.service';

@Injectable()
export class AlbumValidationHelper {
  constructor(
    private readonly albumRepository: AlbumRepository,
    private readonly albumService: AlbumService,
    @InjectPinoLogger(AlbumValidationHelper.name)
    private readonly logger: PinoLogger,
  ) {}

  async getValidatedAlbumId(userId: string, albumId?: string): Promise<string> {
    if (albumId) {
      const album = await this.albumRepository.findOneForUser(albumId, userId);
      if (!album) {
        this.logger.warn(
          { userId, albumId },
          'Album not found or access denied',
        );
        throw new NotFoundException('Album not found');
      }
      return albumId;
    }

    const defaultAlbum = await this.albumService.findOrCreateDefault(userId);
    return defaultAlbum.id;
  }
}

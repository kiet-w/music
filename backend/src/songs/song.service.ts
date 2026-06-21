import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { SongRepository } from './repositories/song.repository';
import { AlbumRepository } from '../albums/repositories/album.repository';
import { AlbumService } from '../albums/album.service';
import { plainToInstance } from 'class-transformer';
import { SongResponseDto } from './dto/song-response.dto';

@Injectable()
export class SongService {
  constructor(
    private songRepository: SongRepository,
    private albumRepository: AlbumRepository,
    private albumService: AlbumService,
    @InjectQueue('conversion') private conversionQueue: Queue,
    @InjectPinoLogger(SongService.name)
    private readonly logger: PinoLogger,
  ) {}

  async createFromYoutube(
    userId: string,
    url: string,
    title: string,
    artist?: string,
    albumId?: string,
  ): Promise<SongResponseDto> {
    this.logger.info(
      { userId, url, title, artist, albumId },
      'Creating song from Youtube',
    );

    const finalAlbumId = await this.getValidatedAlbumId(userId, albumId);
    const youtubeId = this.extractYoutubeId(url);

    if (youtubeId) {
      const existingTrack = await this.songRepository.findFirst({
        where: {
          sourceType: 'youtube',
          sourceId: youtubeId,
          url: { not: '' },
        },
      });

      if (existingTrack) {
        this.logger.info(
          { youtubeId, existingTrackId: existingTrack.id },
          'Found existing track for YouTube ID, reusing storage URL',
        );
        const song = await this.songRepository.create({
          data: {
            title,
            artist: artist || existingTrack.artist,
            url: existingTrack.url,
            duration: existingTrack.duration,
            albumId: finalAlbumId,
            sourceType: 'youtube',
            sourceId: youtubeId,
          },
        });
        return this.mapToResponse(song);
      }
    }

    const song = await this.songRepository.create({
      data: {
        title,
        artist,
        url: '',
        albumId: finalAlbumId,
        sourceType: 'youtube',
        sourceId: youtubeId,
      },
    });

    this.logger.info(
      { songId: song.id },
      'Song record created, adding to conversion queue',
    );
    await this.conversionQueue.add(
      'convert',
      {
        url,
        songId: song.id,
        userId,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    );

    return this.mapToResponse(song);
  }

  async findAll(userId: string, skip: number = 0, take: number = 50) {
    this.logger.debug({ userId, skip, take }, 'Finding all songs for user');
    const where = {
      album: {
        userId,
      },
    };

    const [total, songs] = await Promise.all([
      this.songRepository.count({ where }),
      this.songRepository.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { album: true },
      }),
    ]);

    return {
      data: this.mapToResponseArray(songs),
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findOne(userId: string, id: string): Promise<SongResponseDto> {
    this.logger.debug({ userId, id }, 'Finding song by ID for user');
    const song = await this.findAndValidateSong(userId, id);
    return this.mapToResponse(song);
  }

  async remove(userId: string, id: string): Promise<void> {
    this.logger.info({ userId, id }, 'Removing song');
    await this.findAndValidateSong(userId, id);
    await this.songRepository.delete({
      where: { id },
    });
  }

  async moveToAlbum(
    userId: string,
    id: string,
    albumId: string,
  ): Promise<SongResponseDto> {
    this.logger.info({ userId, id, albumId }, 'Moving song to album');

    await this.findAndValidateSong(userId, id);
    const validatedAlbumId = await this.getValidatedAlbumId(userId, albumId);

    const updatedSong = await this.songRepository.update({
      where: { id },
      data: { albumId: validatedAlbumId },
    });

    return this.mapToResponse(updatedSong);
  }

  // --- Private Helpers ---

  private extractYoutubeId(url: string): string | null {
    try {
      if (url.includes('youtu.be/')) {
        const parts = url.split('youtu.be/');
        if (parts[1]) {
          const id = parts[1].split(/[?#]/)[0];
          if (id.length === 11) return id;
        }
      }
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      if (match && match[2] && match[2].length === 11) {
        return match[2];
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getValidatedAlbumId(
    userId: string,
    albumId?: string,
  ): Promise<string> {
    if (albumId) {
      const album = await this.albumRepository.findUnique({
        where: { id: albumId },
      });
      if (!album || album.userId !== userId) {
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

  private async findAndValidateSong(userId: string, id: string) {
    const song = await this.songRepository.findFirst({
      where: {
        id,
        album: {
          userId,
        },
      },
      include: { album: true },
    });

    if (!song) {
      this.logger.warn({ userId, id }, 'Song not found or access denied');
      throw new NotFoundException('Song not found');
    }
    return song;
  }

  private mapToResponse(song: any): SongResponseDto {
    return plainToInstance(SongResponseDto, song, {
      excludeExtraneousValues: true,
    });
  }

  private mapToResponseArray(songs: any[]): SongResponseDto[] {
    return plainToInstance(SongResponseDto, songs, {
      excludeExtraneousValues: true,
    });
  }
}

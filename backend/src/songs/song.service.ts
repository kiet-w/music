import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { SongRepository } from './repositories/song.repository';
import { AlbumRepository } from '../albums/repositories/album.repository';
import { AlbumService } from '../albums/album.service';

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
  ) {
    this.logger.info({ userId, url, title, artist, albumId }, 'Creating song from Youtube');
    let finalAlbumId = albumId;

    if (finalAlbumId) {
      const album = await this.albumRepository.findUnique({
        where: { id: finalAlbumId },
      });
      if (!album || album.userId !== userId) {
        this.logger.warn({ userId, albumId: finalAlbumId }, 'Album not found or access denied');
        throw new NotFoundException('Album not found');
      }
    } else {
      const defaultAlbum = await this.albumService.findOrCreateDefault(userId);
      finalAlbumId = defaultAlbum.id;
    }

    const song = await this.songRepository.create({
      data: {
        title,
        artist,
        url: '',
        albumId: finalAlbumId,
        sourceType: 'youtube',
      },
    });

    this.logger.info({ songId: song.id }, 'Song record created, adding to conversion queue');
    await this.conversionQueue.add('convert', {
      url,
      songId: song.id,
      userId,
    });

    return song;
  }

  async findAll(userId: string) {
    this.logger.debug({ userId }, 'Finding all songs for user');
    return this.songRepository.findMany({
      where: {
        album: {
          userId,
        },
      },
      include: { album: true },
    });
  }

  async findOne(userId: string, id: string) {
    this.logger.debug({ userId, id }, 'Finding song by ID for user');
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
      return null;
    }
    return song;
  }

  async remove(userId: string, id: string) {
    this.logger.info({ userId, id }, 'Removing song');
    const song = await this.songRepository.findFirst({
      where: {
        id,
        album: {
          userId,
        },
      },
    });
    if (!song) {
      this.logger.warn({ userId, id }, 'Song not found for removal');
      throw new NotFoundException('Song not found');
    }
    return this.songRepository.delete({
      where: { id },
    });
  }

  async moveToAlbum(userId: string, id: string, albumId: string) {
    this.logger.info({ userId, id, albumId }, 'Moving song to album');
    const song = await this.songRepository.findFirst({
      where: {
        id,
        album: {
          userId,
        },
      },
    });
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const targetAlbum = await this.albumRepository.findUnique({
      where: { id: albumId },
    });
    if (!targetAlbum || targetAlbum.userId !== userId) {
      throw new NotFoundException('Target album not found');
    }

    return this.songRepository.update({
      where: { id },
      data: { albumId },
    });
  }
}

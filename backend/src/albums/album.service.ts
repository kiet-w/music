import { Injectable } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { AlbumRepository } from './repositories/album.repository';

@Injectable()
export class AlbumService {
  constructor(
    private readonly albumRepository: AlbumRepository,
    @InjectPinoLogger(AlbumService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: string, data: { title: string; artist?: string; coverUrl?: string }) {
    this.logger.info({ userId, data }, 'Creating new album');
    return this.albumRepository.create({
      data: {
        ...data,
        userId,
      },
    });
  }

  async findOrCreateDefault(userId: string) {
    this.logger.debug({ userId }, 'Finding or creating default album');
    const existing = await this.albumRepository.findDefault(userId);
    if (existing) {
      return existing;
    }

    try {
      return await this.albumRepository.create({
        data: {
          title: 'Default',
          artist: 'Various Artists',
          isDefault: true,
          userId,
        },
      });
    } catch (error) {
      // Handle race condition where another request created it between find and create
      const raceResult = await this.albumRepository.findDefault(userId);
      if (raceResult) {
        return raceResult;
      }
      throw error;
    }
  }

  async findAll(userId: string) {
    this.logger.debug({ userId }, 'Finding all albums for user');
    const albums = await this.albumRepository.findMany({
      where: { userId },
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });

    return albums.map((album: any) => ({
      ...album,
      _count: {
        songs: album._count?.tracks || 0,
      },
    }));
  }

  async findOne(userId: string, id: string) {
    this.logger.debug({ userId, id }, 'Finding album by ID for user');
    const album = await this.albumRepository.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { tracks: true },
        },
      },
    });

    if (!album) {
      this.logger.warn({ userId, id }, 'Album not found or access denied');
      return null;
    }

    const albumWithCount = album as any;
    return {
      ...albumWithCount,
      _count: {
        songs: albumWithCount._count?.tracks || 0,
      },
    };
  }
}

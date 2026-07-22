import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { AlbumRepository } from './repositories/album.repository';
import { CreateAlbumDto } from './dto/create-album.dto';
import { UpdateAlbumDto } from './dto/update-album.dto';

@Injectable()
export class AlbumService {
  constructor(
    private readonly albumRepository: AlbumRepository,
    @InjectPinoLogger(AlbumService.name)
    private readonly logger: PinoLogger,
  ) {}

  async create(userId: string, data: CreateAlbumDto) {
    this.logger.info({ userId, data }, 'Creating new album for user');
    const album = await this.albumRepository.create({
      data: {
        ...data,
        userId,
      },
    });
    return this.mapAlbumResponse(album);
  }

  async findOrCreateDefault(userId: string) {
    this.logger.debug({ userId }, 'Finding or creating default album for user');
    const existing = await this.albumRepository.findDefault(userId);
    if (existing) {
      return this.mapAlbumResponse(existing);
    }
    try {
      const album = await this.albumRepository.create({
        data: {
          title: 'Default',
          artist: 'Various Artists',
          isDefault: true,
          userId,
        },
      });
      return this.mapAlbumResponse(album);
    } catch (error) {
      // Handle race condition where another request created it between find and create
      const raceResult = await this.albumRepository.findDefault(userId);
      if (raceResult) {
        return this.mapAlbumResponse(raceResult);
      }
      throw error;
    }
  }

  async findAll(userId: string, skip: number = 0, take: number = 50) {
    this.logger.debug({ userId, skip, take }, 'Finding all albums for user');

    const { total, albums } = await this.albumRepository.findAllForUser(
      userId,
      skip,
      take,
    );

    return {
      data: albums.map((album) => this.mapAlbumResponse(album)),
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  async findOne(userId: string, id: string) {
    this.logger.debug({ userId, id }, 'Finding album by ID for user');
    const album = await this.albumRepository.findOneForUser(id, userId);

    if (!album) {
      throw new NotFoundException(`Album with ID ${id} not found`);
    }

    return this.mapAlbumResponse(album);
  }

  async update(userId: string, id: string, data: UpdateAlbumDto) {
    this.logger.info({ userId, id, data }, 'Updating album for user');
    const album = await this.albumRepository.updateOneForUser(id, userId, data);

    if (!album) {
      throw new NotFoundException(`Album with ID ${id} not found`);
    }

    return this.mapAlbumResponse(album);
  }

  async remove(userId: string, id: string) {
    this.logger.info({ userId, id }, 'Deleting album for user');
    const album = await this.albumRepository.deleteOneForUser(id, userId);

    if (!album) {
      throw new NotFoundException(`Album with ID ${id} not found`);
    }

    return { message: 'Album deleted successfully', id: album.id };
  }

  private mapAlbumResponse(album: any) {
    if (!album) return null;
    return {
      ...album,
      _count: {
        songs: album._count?.tracks || 0,
      },
    };
  }
}

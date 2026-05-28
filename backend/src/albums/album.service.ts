import { Injectable } from '@nestjs/common';
import { AlbumRepository } from './repositories/album.repository';

@Injectable()
export class AlbumService {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async create(data: { title: string; artist?: string; coverUrl?: string }) {
    return this.albumRepository.create({ data });
  }

  async findAll() {
    const albums = await this.albumRepository.findMany({
      include: {
        tracks: true,
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

  async findOne(id: string) {
    const album = await this.albumRepository.findUnique({
      where: { id },
      include: {
        tracks: true,
        _count: {
          select: { tracks: true },
        },
      },
    });

    if (!album) return null;

    const albumWithCount = album as any;
    return {
      ...albumWithCount,
      _count: {
        songs: albumWithCount._count?.tracks || 0,
      },
    };
  }
}

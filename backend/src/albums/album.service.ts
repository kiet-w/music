import { Injectable } from '@nestjs/common';
import { AlbumRepository } from './repositories/album.repository';

@Injectable()
export class AlbumService {
  constructor(private readonly albumRepository: AlbumRepository) {}

  async create(data: { title: string; artist?: string; coverUrl?: string }) {
    return this.albumRepository.create({ data });
  }

  async findAll() {
    return this.albumRepository.findMany({
      include: { tracks: true },
    });
  }

  async findOne(id: string) {
    return this.albumRepository.findUnique({
      where: { id },
      include: { tracks: true },
    });
  }
}

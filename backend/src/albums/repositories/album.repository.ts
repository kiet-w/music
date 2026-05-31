import { Injectable } from '@nestjs/common';
import { Album, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class AlbumRepository extends BaseRepository<
  Album,
  Prisma.AlbumDelegate<any>
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.album);
  }

  async findByUserAndTitle(
    userId: string,
    title: string,
  ): Promise<Album | null> {
    return this.prisma.album.findFirst({
      where: {
        userId,
        title,
      },
    });
  }

  async findDefault(userId: string): Promise<Album | null> {
    return this.prisma.album.findFirst({
      where: {
        userId,
        isDefault: true,
      },
    });
  }

  async findByTitleAndArtist(
    title: string,
    artist: string,
  ): Promise<Album | null> {
    return this.prisma.album.findFirst({
      where: {
        title,
        artist,
      },
    });
  }
}

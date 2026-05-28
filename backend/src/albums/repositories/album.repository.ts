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

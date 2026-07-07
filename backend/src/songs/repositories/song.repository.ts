import { Injectable } from '@nestjs/common';
import { Prisma, Track } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';

@Injectable()
export class SongRepository extends BaseRepository<
  Track,
  Prisma.TrackDelegate<any>
> {
  constructor(prisma: PrismaService) {
    super(prisma, prisma.track);
  }

  async findByYoutubeId(youtubeId: string): Promise<Track | null> {
    return this.findFirst({
      where: {
        sourceType: 'youtube',
        sourceId: youtubeId,
        url: { not: '' },
      },
    });
  }

  async findPendingByYoutubeId(youtubeId: string): Promise<Track | null> {
    return this.findFirst({
      where: {
        sourceType: 'youtube',
        sourceId: youtubeId,
        url: '',
      },
    });
  }

  async findByUserAndId(userId: string, id: string): Promise<Track | null> {
    return this.findFirst({
      where: { id, userId },
      include: { album: true },
    });
  }

  async findAllByUser(
    userId: string,
    skip: number,
    take: number,
    orderBy: any,
  ): Promise<Track[]> {
    return this.findMany({
      where: { userId },
      skip,
      take,
      orderBy,
      include: { album: true },
    });
  }

  async countByUser(userId: string): Promise<number> {
    return this.count({ where: { userId } });
  }
}

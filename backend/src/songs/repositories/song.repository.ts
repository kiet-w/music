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
}

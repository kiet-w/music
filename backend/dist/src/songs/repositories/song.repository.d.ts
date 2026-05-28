import { Prisma, Track } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
export declare class SongRepository extends BaseRepository<Track, Prisma.TrackDelegate<any>> {
    constructor(prisma: PrismaService);
}

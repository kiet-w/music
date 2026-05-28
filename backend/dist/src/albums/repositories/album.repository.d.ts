import { Album, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BaseRepository } from '../../common/repositories/base.repository';
export declare class AlbumRepository extends BaseRepository<Album, Prisma.AlbumDelegate<any>> {
    constructor(prisma: PrismaService);
    findByTitleAndArtist(title: string, artist: string): Promise<Album | null>;
}

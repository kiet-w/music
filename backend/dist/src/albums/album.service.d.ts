import { AlbumRepository } from './repositories/album.repository';
export declare class AlbumService {
    private readonly albumRepository;
    constructor(albumRepository: AlbumRepository);
    create(data: {
        title: string;
        artist?: string;
        coverUrl?: string;
    }): Promise<{
        id: string;
        title: string;
        artist: string | null;
        createdAt: Date;
        coverUrl: string | null;
    }>;
    findAll(): Promise<{
        id: string;
        title: string;
        artist: string | null;
        createdAt: Date;
        coverUrl: string | null;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        title: string;
        artist: string | null;
        createdAt: Date;
        coverUrl: string | null;
    } | null>;
}

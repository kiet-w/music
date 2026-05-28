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
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
}

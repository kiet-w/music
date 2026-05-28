import { Queue } from 'bullmq';
import { SongRepository } from './repositories/song.repository';
import { AlbumRepository } from '../albums/repositories/album.repository';
export declare class SongService {
    private songRepository;
    private albumRepository;
    private conversionQueue;
    constructor(songRepository: SongRepository, albumRepository: AlbumRepository, conversionQueue: Queue);
    createFromYoutube(url: string, title: string, artist?: string, albumId?: string): Promise<{
        id: string;
        title: string;
        artist: string | null;
        url: string;
        duration: number | null;
        albumId: string;
        sourceType: string | null;
        sourceId: string | null;
        createdAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        title: string;
        artist: string | null;
        url: string;
        duration: number | null;
        albumId: string;
        sourceType: string | null;
        sourceId: string | null;
        createdAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        title: string;
        artist: string | null;
        url: string;
        duration: number | null;
        albumId: string;
        sourceType: string | null;
        sourceId: string | null;
        createdAt: Date;
    } | null>;
    remove(id: string): Promise<{
        id: string;
        title: string;
        artist: string | null;
        url: string;
        duration: number | null;
        albumId: string;
        sourceType: string | null;
        sourceId: string | null;
        createdAt: Date;
    }>;
    moveToAlbum(id: string, albumId: string): Promise<{
        id: string;
        title: string;
        artist: string | null;
        url: string;
        duration: number | null;
        albumId: string;
        sourceType: string | null;
        sourceId: string | null;
        createdAt: Date;
    }>;
}

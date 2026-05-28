import { SongRepository } from '../songs/repositories/song.repository';
import { StorageCleanupService } from '../storage/storage-cleanup.service';
export declare class AdminController {
    private readonly songRepository;
    private readonly storageCleanupService;
    constructor(songRepository: SongRepository, storageCleanupService: StorageCleanupService);
    deleteTrack(id: string): Promise<{
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
    cleanupStorage(body: {
        bucketName: string;
        path: string;
    }): Promise<{
        message: string;
        file: string;
    }>;
}

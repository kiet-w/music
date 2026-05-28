import type { IStorageProvider } from '../common/interfaces/storage-provider.interface';
export declare class StorageCleanupService {
    private readonly storageProvider;
    private readonly logger;
    constructor(storageProvider: IStorageProvider);
    cleanupFile(bucketName: string, path: string): Promise<void>;
}

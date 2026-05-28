import { IDownloaderProvider } from '../common/interfaces/downloader-provider.interface';
export declare class DownloaderService implements IDownloaderProvider {
    private readonly logger;
    download(url: string, outputPath: string): Promise<void>;
    cleanup(filePath: string): Promise<void>;
}

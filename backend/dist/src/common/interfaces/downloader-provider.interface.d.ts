export interface IDownloaderProvider {
    download(url: string, outputPath: string): Promise<void>;
    cleanup(filePath: string): Promise<void>;
}

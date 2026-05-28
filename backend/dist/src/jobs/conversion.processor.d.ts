import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DownloaderService } from '../downloader/downloader.service';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class ConversionProcessor extends WorkerHost {
    private readonly downloaderService;
    private readonly storageService;
    private readonly prisma;
    private readonly logger;
    constructor(downloaderService: DownloaderService, storageService: StorageService, prisma: PrismaService);
    process(job: Job<any, any, string>): Promise<any>;
}

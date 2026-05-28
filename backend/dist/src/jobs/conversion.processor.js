"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ConversionProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const downloader_service_1 = require("../downloader/downloader.service");
const storage_service_1 = require("../storage/storage.service");
const prisma_service_1 = require("../prisma/prisma.service");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let ConversionProcessor = ConversionProcessor_1 = class ConversionProcessor extends bullmq_1.WorkerHost {
    downloaderService;
    storageService;
    prisma;
    logger = new common_1.Logger(ConversionProcessor_1.name);
    constructor(downloaderService, storageService, prisma) {
        super();
        this.downloaderService = downloaderService;
        this.storageService = storageService;
        this.prisma = prisma;
    }
    async process(job) {
        const { url, songId } = job.data;
        const tempDir = path.join(__dirname, '../../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        const outputPath = path.join(tempDir, `${songId}.mp3`);
        try {
            await this.downloaderService.download(url, outputPath);
            const storagePath = `songs/${songId}.mp3`;
            await this.storageService.upload(outputPath, 'music', storagePath);
            const publicUrl = await this.storageService.getPublicUrl('music', storagePath);
            await this.prisma.track.update({
                where: { id: songId },
                data: { url: publicUrl },
            });
            await this.downloaderService.cleanup(outputPath);
            return { storagePath, publicUrl };
        }
        catch (error) {
            this.logger.error('Job failed:', error);
            await this.downloaderService.cleanup(outputPath);
            throw error;
        }
    }
};
exports.ConversionProcessor = ConversionProcessor;
exports.ConversionProcessor = ConversionProcessor = ConversionProcessor_1 = __decorate([
    (0, bullmq_1.Processor)('conversion'),
    __metadata("design:paramtypes", [downloader_service_1.DownloaderService,
        storage_service_1.StorageService,
        prisma_service_1.PrismaService])
], ConversionProcessor);
//# sourceMappingURL=conversion.processor.js.map
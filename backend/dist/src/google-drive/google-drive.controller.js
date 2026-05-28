"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveController = void 0;
const common_1 = require("@nestjs/common");
const google_drive_service_1 = require("./google-drive.service");
const storage_service_1 = require("../storage/storage.service");
const song_repository_1 = require("../songs/repositories/song.repository");
const import_dto_1 = require("./dto/import.dto");
let GoogleDriveController = class GoogleDriveController {
    googleDriveService;
    storageService;
    songRepository;
    constructor(googleDriveService, storageService, songRepository) {
        this.googleDriveService = googleDriveService;
        this.storageService = storageService;
        this.songRepository = songRepository;
    }
    ping() {
        return { status: 'ok', timestamp: new Date().toISOString(), version: '2.0-debug' };
    }
    async listFiles(token) {
        try {
            return await this.googleDriveService.listFiles(token);
        }
        catch (error) {
            console.error('Error in listFiles controller:', error);
            return {
                error: true,
                message: error.message,
                details: error.response?.data || error,
                stack: error.stack
            };
        }
    }
    async importFile(importDto) {
        const { fileId, accessToken, albumId } = importDto;
        const metadata = await this.googleDriveService.getFileMetadata(accessToken, fileId);
        const buffer = await this.googleDriveService.downloadFile(accessToken, fileId);
        const originalName = metadata.name || 'unknown';
        const sanitizedName = originalName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `songs/${albumId}/${Date.now()}_${sanitizedName}`;
        const path = await this.storageService.uploadBuffer(buffer, 'music', storagePath, metadata.mimeType || 'audio/mpeg');
        const url = await this.storageService.getPublicUrl('music', path);
        return this.songRepository.create({
            data: {
                title: originalName.replace(/\.[^/.]+$/, ''),
                artist: 'Unknown Artist',
                url,
                albumId,
                sourceType: 'google-drive',
                sourceId: fileId,
            },
        });
    }
};
exports.GoogleDriveController = GoogleDriveController;
__decorate([
    (0, common_1.Get)('ping'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GoogleDriveController.prototype, "ping", null);
__decorate([
    (0, common_1.Get)('files'),
    __param(0, (0, common_1.Query)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GoogleDriveController.prototype, "listFiles", null);
__decorate([
    (0, common_1.Post)('import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_dto_1.ImportDto]),
    __metadata("design:returntype", Promise)
], GoogleDriveController.prototype, "importFile", null);
exports.GoogleDriveController = GoogleDriveController = __decorate([
    (0, common_1.Controller)('google-drive'),
    __metadata("design:paramtypes", [google_drive_service_1.GoogleDriveService,
        storage_service_1.StorageService,
        song_repository_1.SongRepository])
], GoogleDriveController);
//# sourceMappingURL=google-drive.controller.js.map
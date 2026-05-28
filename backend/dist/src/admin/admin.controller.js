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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const song_repository_1 = require("../songs/repositories/song.repository");
const storage_cleanup_service_1 = require("../storage/storage-cleanup.service");
let AdminController = class AdminController {
    songRepository;
    storageCleanupService;
    constructor(songRepository, storageCleanupService) {
        this.songRepository = songRepository;
        this.storageCleanupService = storageCleanupService;
    }
    async deleteTrack(id) {
        return this.songRepository.delete({
            where: { id },
        });
    }
    async cleanupStorage(body) {
        await this.storageCleanupService.cleanupFile(body.bucketName, body.path);
        return { message: 'Storage cleanup initiated', file: body.path };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Delete)('tracks/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteTrack", null);
__decorate([
    (0, common_1.Post)('storage/cleanup'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "cleanupStorage", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [song_repository_1.SongRepository,
        storage_cleanup_service_1.StorageCleanupService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map
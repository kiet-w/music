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
var StorageCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageCleanupService = void 0;
const common_1 = require("@nestjs/common");
let StorageCleanupService = StorageCleanupService_1 = class StorageCleanupService {
    storageProvider;
    logger = new common_1.Logger(StorageCleanupService_1.name);
    constructor(storageProvider) {
        this.storageProvider = storageProvider;
    }
    async cleanupFile(bucketName, path) {
        this.logger.log(`Initiating cleanup for file: ${path} in bucket: ${bucketName}`);
        await this.storageProvider.delete(bucketName, path);
    }
};
exports.StorageCleanupService = StorageCleanupService;
exports.StorageCleanupService = StorageCleanupService = StorageCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IStorageProvider')),
    __metadata("design:paramtypes", [Object])
], StorageCleanupService);
//# sourceMappingURL=storage-cleanup.service.js.map
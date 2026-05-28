"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const app_controller_1 = require("./core/app.controller");
const app_service_1 = require("./core/app.service");
const downloader_module_1 = require("./downloader/downloader.module");
const storage_module_1 = require("./storage/storage.module");
const jobs_module_1 = require("./jobs/jobs.module");
const prisma_module_1 = require("./prisma/prisma.module");
const songs_module_1 = require("./songs/songs.module");
const albums_module_1 = require("./albums/albums.module");
const google_drive_module_1 = require("./google-drive/google-drive.module");
const admin_module_1 = require("./admin/admin.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            cache_manager_1.CacheModule.register({
                isGlobal: true,
                ttl: 60000,
            }),
            downloader_module_1.DownloaderModule,
            storage_module_1.StorageModule,
            jobs_module_1.JobsModule,
            prisma_module_1.PrismaModule,
            songs_module_1.SongsModule,
            albums_module_1.AlbumsModule,
            google_drive_module_1.GoogleDriveModule,
            admin_module_1.AdminModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map
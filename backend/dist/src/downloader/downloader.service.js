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
var DownloaderService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DownloaderService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
let DownloaderService = DownloaderService_1 = class DownloaderService {
    logger = new common_1.Logger(DownloaderService_1.name);
    async download(url, outputPath) {
        try {
            this.logger.log(`Starting download from ${url} to ${outputPath}`);
            await execAsync(`yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`);
            this.logger.log(`Download completed: ${outputPath}`);
        }
        catch (error) {
            this.logger.error(`Download failed for URL ${url}: ${error.message}`);
            throw new common_1.InternalServerErrorException(`yt-dlp download failed: ${error.message}`);
        }
    }
    async cleanup(filePath) {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.logger.log(`Temporary file cleaned up: ${filePath}`);
            }
        }
        catch (error) {
            this.logger.error(`Failed to cleanup file ${filePath}: ${error.message}`);
        }
    }
};
exports.DownloaderService = DownloaderService;
exports.DownloaderService = DownloaderService = DownloaderService_1 = __decorate([
    (0, common_1.Injectable)()
], DownloaderService);
//# sourceMappingURL=downloader.service.js.map
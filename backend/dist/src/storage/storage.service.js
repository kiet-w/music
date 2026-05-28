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
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const fs = __importStar(require("fs"));
let StorageService = StorageService_1 = class StorageService {
    supabase;
    logger = new common_1.Logger(StorageService_1.name);
    constructor() {
        const rawUrl = process.env.SUPABASE_URL;
        const rawKey = process.env.SUPABASE_KEY;
        const isValidUrl = (url) => {
            if (!url)
                return false;
            try {
                const parsed = new URL(url);
                return parsed.protocol === 'http:' || parsed.protocol === 'https:';
            }
            catch {
                return false;
            }
        };
        const isConfigured = isValidUrl(rawUrl) && !!rawKey;
        if (!isConfigured) {
            this.logger.error(`Supabase is not correctly configured. URL: ${rawUrl}, Key present: ${!!rawKey}`);
        }
        this.supabase = (0, supabase_js_1.createClient)(isConfigured ? rawUrl : 'https://placeholder.supabase.co', isConfigured ? rawKey : 'placeholder-key');
    }
    async upload(filePath, bucketName, destinationPath) {
        try {
            this.logger.log(`Uploading file from ${filePath} to ${bucketName}/${destinationPath}`);
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found at path: ${filePath}`);
            }
            const fileBuffer = fs.readFileSync(filePath);
            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .upload(destinationPath, fileBuffer, {
                contentType: 'audio/mpeg',
                upsert: true,
            });
            if (error) {
                this.logger.error(`Supabase upload error: ${error.message}`);
                throw new common_1.InternalServerErrorException(`Supabase upload failed: ${error.message}`);
            }
            this.logger.log(`File uploaded successfully: ${data.path}`);
            return data.path;
        }
        catch (error) {
            this.logger.error(`Upload failed: ${error.message}`);
            throw error instanceof common_1.InternalServerErrorException
                ? error
                : new common_1.InternalServerErrorException(error.message);
        }
    }
    async uploadBuffer(buffer, bucketName, destinationPath, contentType = 'audio/mpeg') {
        try {
            this.logger.log(`Uploading buffer to ${bucketName}/${destinationPath} with content-type ${contentType}`);
            const { data, error } = await this.supabase.storage
                .from(bucketName)
                .upload(destinationPath, buffer, {
                contentType,
                upsert: true,
            });
            if (error) {
                this.logger.error(`Supabase upload error: ${error.message}`);
                throw new common_1.InternalServerErrorException(`Supabase upload failed: ${error.message}`);
            }
            this.logger.log(`Buffer uploaded successfully: ${data.path}`);
            return data.path;
        }
        catch (error) {
            this.logger.error(`Buffer upload failed: ${error.message}`);
            throw error instanceof common_1.InternalServerErrorException
                ? error
                : new common_1.InternalServerErrorException(error.message);
        }
    }
    async getPublicUrl(bucketName, path) {
        const { data } = this.supabase.storage.from(bucketName).getPublicUrl(path);
        return data.publicUrl;
    }
    async delete(bucketName, path) {
        try {
            this.logger.log(`Deleting file from ${bucketName}/${path}`);
            const { error } = await this.supabase.storage
                .from(bucketName)
                .remove([path]);
            if (error) {
                this.logger.error(`Supabase delete error: ${error.message}`);
                throw new common_1.InternalServerErrorException(`Supabase delete failed: ${error.message}`);
            }
            this.logger.log(`File deleted successfully: ${path}`);
        }
        catch (error) {
            this.logger.error(`Delete failed: ${error.message}`);
            throw error instanceof common_1.InternalServerErrorException
                ? error
                : new common_1.InternalServerErrorException(error.message);
        }
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], StorageService);
//# sourceMappingURL=storage.service.js.map
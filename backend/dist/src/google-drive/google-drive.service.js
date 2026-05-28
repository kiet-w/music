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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleDriveService = void 0;
const common_1 = require("@nestjs/common");
const googleapis_1 = require("googleapis");
let GoogleDriveService = class GoogleDriveService {
    oauth2Client;
    constructor() {
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    }
    async listFiles(accessToken) {
        this.oauth2Client.setCredentials({ access_token: accessToken });
        const drive = googleapis_1.google.drive({ version: 'v3', auth: this.oauth2Client });
        console.log('Searching for audio files in Google Drive (including Shared Drives)...');
        try {
            const res = await drive.files.list({
                pageSize: 1000,
                fields: 'nextPageToken, files(id, name, mimeType, size, shortcutDetails, capabilities, driveId)',
                q: "trashed = false",
                supportsAllDrives: true,
                includeItemsFromAllDrives: true,
            });
            const files = res.data.files || [];
            console.log(`Successfully fetched ${files.length} total files from Drive.`);
            const musicFiles = files.filter(file => {
                const name = file.name?.toLowerCase() || '';
                const mime = file.mimeType?.toLowerCase() || '';
                const isAudioMime = mime.includes('audio') ||
                    mime.includes('mpeg') ||
                    mime.includes('flac') ||
                    mime.includes('wav');
                const isAudioExt = name.endsWith('.mp3') ||
                    name.endsWith('.wav') ||
                    name.endsWith('.flac') ||
                    name.endsWith('.m4a') ||
                    name.endsWith('.mp4');
                const isShortcutToAudio = mime === 'application/vnd.google-apps.shortcut' &&
                    (file.shortcutDetails?.targetMimeType?.includes('audio') || name.endsWith('.mp3'));
                return isAudioMime || isAudioExt || isShortcutToAudio;
            });
            const resolvedFiles = musicFiles.map(file => {
                if (file.mimeType === 'application/vnd.google-apps.shortcut' && file.shortcutDetails?.targetId) {
                    return {
                        ...file,
                        id: file.shortcutDetails.targetId,
                        mimeType: file.shortcutDetails.targetMimeType || 'audio/mpeg',
                        isShortcut: true
                    };
                }
                return file;
            });
            console.log(`Filtered down to ${resolvedFiles.length} music files.`);
            return resolvedFiles;
        }
        catch (error) {
            console.error('CRITICAL ERROR in listFiles:');
            if (error.response) {
                console.error('Google API Error Response:', JSON.stringify(error.response.data, null, 2));
            }
            else {
                console.error('Error Message:', error.message);
            }
            throw error;
        }
    }
    async getFileMetadata(accessToken, fileId) {
        this.oauth2Client.setCredentials({ access_token: accessToken });
        const drive = googleapis_1.google.drive({ version: 'v3', auth: this.oauth2Client });
        const res = await drive.files.get({
            fileId,
            fields: 'id, name, mimeType, size',
            supportsAllDrives: true,
        });
        return res.data;
    }
    async downloadFile(accessToken, fileId) {
        this.oauth2Client.setCredentials({ access_token: accessToken });
        const drive = googleapis_1.google.drive({ version: 'v3', auth: this.oauth2Client });
        const meta = await drive.files.get({
            fileId,
            fields: 'name, mimeType, size',
            supportsAllDrives: true,
        });
        console.log(`Downloading: ${meta.data.name} (${meta.data.mimeType}) - Size: ${meta.data.size}`);
        const res = await drive.files.get({
            fileId,
            alt: 'media',
            supportsAllDrives: true,
            acknowledgeAbuse: true
        }, { responseType: 'arraybuffer' });
        return Buffer.from(res.data);
    }
};
exports.GoogleDriveService = GoogleDriveService;
exports.GoogleDriveService = GoogleDriveService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], GoogleDriveService);
//# sourceMappingURL=google-drive.service.js.map
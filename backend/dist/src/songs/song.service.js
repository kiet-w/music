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
exports.SongService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const song_repository_1 = require("./repositories/song.repository");
const album_repository_1 = require("../albums/repositories/album.repository");
let SongService = class SongService {
    songRepository;
    albumRepository;
    conversionQueue;
    constructor(songRepository, albumRepository, conversionQueue) {
        this.songRepository = songRepository;
        this.albumRepository = albumRepository;
        this.conversionQueue = conversionQueue;
    }
    async createFromYoutube(url, title, artist, albumId) {
        let finalAlbumId = albumId;
        if (!finalAlbumId) {
            let defaultAlbum = await this.albumRepository
                .findMany({
                where: { title: 'Default' },
                take: 1,
            })
                .then((albums) => albums[0]);
            if (!defaultAlbum) {
                defaultAlbum = await this.albumRepository.create({
                    data: { title: 'Default', artist: 'Various Artists' },
                });
            }
            finalAlbumId = defaultAlbum.id;
        }
        const song = await this.songRepository.create({
            data: {
                title,
                artist,
                url: '',
                albumId: finalAlbumId,
                sourceType: 'youtube',
            },
        });
        await this.conversionQueue.add('convert', {
            url,
            songId: song.id,
        });
        return song;
    }
    async findAll() {
        return this.songRepository.findMany({
            include: { album: true },
        });
    }
    async findOne(id) {
        return this.songRepository.findUnique({
            where: { id },
            include: { album: true },
        });
    }
    async remove(id) {
        const song = await this.songRepository.findUnique({ where: { id } });
        if (!song) {
            throw new common_1.NotFoundException('Song not found');
        }
        return this.songRepository.delete({
            where: { id },
        });
    }
    async moveToAlbum(id, albumId) {
        const song = await this.songRepository.findUnique({ where: { id } });
        if (!song) {
            throw new common_1.NotFoundException('Song not found');
        }
        return this.songRepository.update({
            where: { id },
            data: { albumId },
        });
    }
};
exports.SongService = SongService;
exports.SongService = SongService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, bullmq_1.InjectQueue)('conversion')),
    __metadata("design:paramtypes", [song_repository_1.SongRepository,
        album_repository_1.AlbumRepository,
        bullmq_2.Queue])
], SongService);
//# sourceMappingURL=song.service.js.map
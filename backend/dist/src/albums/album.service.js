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
exports.AlbumService = void 0;
const common_1 = require("@nestjs/common");
const album_repository_1 = require("./repositories/album.repository");
let AlbumService = class AlbumService {
    albumRepository;
    constructor(albumRepository) {
        this.albumRepository = albumRepository;
    }
    async create(data) {
        return this.albumRepository.create({ data });
    }
    async findAll() {
        const albums = await this.albumRepository.findMany({
            include: {
                tracks: true,
                _count: {
                    select: { tracks: true },
                },
            },
        });
        return albums.map((album) => ({
            ...album,
            _count: {
                songs: album._count?.tracks || 0,
            },
        }));
    }
    async findOne(id) {
        const album = await this.albumRepository.findUnique({
            where: { id },
            include: {
                tracks: true,
                _count: {
                    select: { tracks: true },
                },
            },
        });
        if (!album)
            return null;
        const albumWithCount = album;
        return {
            ...albumWithCount,
            _count: {
                songs: albumWithCount._count?.tracks || 0,
            },
        };
    }
};
exports.AlbumService = AlbumService;
exports.AlbumService = AlbumService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [album_repository_1.AlbumRepository])
], AlbumService);
//# sourceMappingURL=album.service.js.map
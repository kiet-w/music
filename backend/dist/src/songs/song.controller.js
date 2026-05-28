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
exports.SongController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cache_manager_1 = require("@nestjs/cache-manager");
const song_service_1 = require("./song.service");
const create_song_youtube_dto_1 = require("./dto/create-song-youtube.dto");
const song_response_dto_1 = require("./dto/song-response.dto");
const class_transformer_1 = require("class-transformer");
let SongController = class SongController {
    songService;
    constructor(songService) {
        this.songService = songService;
    }
    async createFromYoutube(createSongDto) {
        const song = await this.songService.createFromYoutube(createSongDto.url, createSongDto.title, createSongDto.artist, createSongDto.albumId);
        return (0, class_transformer_1.plainToInstance)(song_response_dto_1.SongResponseDto, song, {
            excludeExtraneousValues: true,
        });
    }
    async findAll() {
        const songs = await this.songService.findAll();
        return (0, class_transformer_1.plainToInstance)(song_response_dto_1.SongResponseDto, songs, {
            excludeExtraneousValues: true,
        });
    }
    async findOne(id) {
        const song = await this.songService.findOne(id);
        return (0, class_transformer_1.plainToInstance)(song_response_dto_1.SongResponseDto, song, {
            excludeExtraneousValues: true,
        });
    }
    async remove(id) {
        await this.songService.remove(id);
    }
    async moveToAlbum(id, albumId) {
        const song = await this.songService.moveToAlbum(id, albumId);
        return (0, class_transformer_1.plainToInstance)(song_response_dto_1.SongResponseDto, song, {
            excludeExtraneousValues: true,
        });
    }
};
exports.SongController = SongController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new song from YouTube URL' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The song has been successfully created.',
        type: song_response_dto_1.SongResponseDto,
    }),
    (0, common_1.Post)('youtube'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_song_youtube_dto_1.CreateSongYoutubeDto]),
    __metadata("design:returntype", Promise)
], SongController.prototype, "createFromYoutube", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all songs' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Return all songs.',
        type: [song_response_dto_1.SongResponseDto],
    }),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SongController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get a song by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Return the song.',
        type: song_response_dto_1.SongResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Song not found.' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SongController.prototype, "findOne", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Delete a song' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Song deleted successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Song not found.' }),
    (0, common_1.HttpCode)(204),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SongController.prototype, "remove", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Move a song to another album' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Song moved successfully.',
        type: song_response_dto_1.SongResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Song not found.' }),
    (0, common_1.Patch)(':id/move'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('albumId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SongController.prototype, "moveToAlbum", null);
exports.SongController = SongController = __decorate([
    (0, swagger_1.ApiTags)('songs'),
    (0, common_1.Controller)('songs'),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    __metadata("design:paramtypes", [song_service_1.SongService])
], SongController);
//# sourceMappingURL=song.controller.js.map
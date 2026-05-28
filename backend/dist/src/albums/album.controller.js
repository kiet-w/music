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
exports.AlbumController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cache_manager_1 = require("@nestjs/cache-manager");
const album_service_1 = require("./album.service");
const album_response_dto_1 = require("./dto/album-response.dto");
const create_album_dto_1 = require("./dto/create-album.dto");
const class_transformer_1 = require("class-transformer");
let AlbumController = class AlbumController {
    albumService;
    constructor(albumService) {
        this.albumService = albumService;
    }
    async create(createAlbumDto) {
        const album = await this.albumService.create(createAlbumDto);
        return (0, class_transformer_1.plainToInstance)(album_response_dto_1.AlbumResponseDto, album);
    }
    async findAll() {
        const albums = await this.albumService.findAll();
        return (0, class_transformer_1.plainToInstance)(album_response_dto_1.AlbumResponseDto, albums);
    }
    async findOne(id) {
        const album = await this.albumService.findOne(id);
        return (0, class_transformer_1.plainToInstance)(album_response_dto_1.AlbumResponseDto, album);
    }
};
exports.AlbumController = AlbumController;
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Create a new album' }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'The album has been successfully created.',
        type: album_response_dto_1.AlbumResponseDto,
    }),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_album_dto_1.CreateAlbumDto]),
    __metadata("design:returntype", Promise)
], AlbumController.prototype, "create", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get all albums' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Return all albums.',
        type: [album_response_dto_1.AlbumResponseDto],
    }),
    (0, common_1.UseInterceptors)(cache_manager_1.CacheInterceptor),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AlbumController.prototype, "findAll", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: 'Get an album by ID' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Return the album.',
        type: album_response_dto_1.AlbumResponseDto,
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Album not found.' }),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AlbumController.prototype, "findOne", null);
exports.AlbumController = AlbumController = __decorate([
    (0, swagger_1.ApiTags)('albums'),
    (0, common_1.Controller)('albums'),
    (0, common_1.UseInterceptors)(common_1.ClassSerializerInterceptor),
    __metadata("design:paramtypes", [album_service_1.AlbumService])
], AlbumController);
//# sourceMappingURL=album.controller.js.map
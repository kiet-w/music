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
exports.AlbumResponseDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
const song_response_dto_1 = require("../../songs/dto/song-response.dto");
class AlbumResponseDto {
    id;
    title;
    artist;
    coverUrl;
    tracks;
}
exports.AlbumResponseDto = AlbumResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The unique identifier of the album' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AlbumResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The title of the album' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AlbumResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The artist of the album',
        required: false,
        nullable: true,
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AlbumResponseDto.prototype, "artist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The URL to the cover image',
        required: false,
        nullable: true,
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], AlbumResponseDto.prototype, "coverUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: () => [song_response_dto_1.SongResponseDto],
        description: 'List of songs in the album',
        required: false,
    }),
    (0, class_transformer_1.Expose)(),
    (0, class_transformer_1.Type)(() => song_response_dto_1.SongResponseDto),
    __metadata("design:type", Array)
], AlbumResponseDto.prototype, "tracks", void 0);
//# sourceMappingURL=album-response.dto.js.map
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
exports.SongResponseDto = void 0;
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class SongResponseDto {
    id;
    title;
    artist;
    url;
    albumId;
    sourceType;
}
exports.SongResponseDto = SongResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The unique identifier of the song' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SongResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The title of the song' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SongResponseDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The artist of the song',
        required: false,
        nullable: true,
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SongResponseDto.prototype, "artist", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The URL to the audio file' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SongResponseDto.prototype, "url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'The album ID this song belongs to',
        required: false,
        nullable: true,
    }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SongResponseDto.prototype, "albumId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'The source type of the song (e.g., youtube)' }),
    (0, class_transformer_1.Expose)(),
    __metadata("design:type", String)
], SongResponseDto.prototype, "sourceType", void 0);
//# sourceMappingURL=song-response.dto.js.map
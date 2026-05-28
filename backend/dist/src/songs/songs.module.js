"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SongsModule = void 0;
const common_1 = require("@nestjs/common");
const song_controller_1 = require("./song.controller");
const song_service_1 = require("./song.service");
const jobs_module_1 = require("../jobs/jobs.module");
const song_repository_1 = require("./repositories/song.repository");
const albums_module_1 = require("../albums/albums.module");
let SongsModule = class SongsModule {
};
exports.SongsModule = SongsModule;
exports.SongsModule = SongsModule = __decorate([
    (0, common_1.Module)({
        imports: [jobs_module_1.JobsModule, albums_module_1.AlbumsModule],
        controllers: [song_controller_1.SongController],
        providers: [song_service_1.SongService, song_repository_1.SongRepository],
        exports: [song_repository_1.SongRepository],
    })
], SongsModule);
//# sourceMappingURL=songs.module.js.map
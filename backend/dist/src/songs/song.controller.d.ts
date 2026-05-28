import { SongService } from './song.service';
import { CreateSongYoutubeDto } from './dto/create-song-youtube.dto';
import { SongResponseDto } from './dto/song-response.dto';
export declare class SongController {
    private readonly songService;
    constructor(songService: SongService);
    createFromYoutube(createSongDto: CreateSongYoutubeDto): Promise<SongResponseDto>;
    findAll(): Promise<SongResponseDto[]>;
    findOne(id: string): Promise<SongResponseDto>;
    remove(id: string): Promise<void>;
    moveToAlbum(id: string, albumId: string): Promise<SongResponseDto>;
}

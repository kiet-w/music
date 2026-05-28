import { SongResponseDto } from '../../songs/dto/song-response.dto';
export declare class AlbumResponseDto {
    id: string;
    title: string;
    artist: string;
    coverUrl: string;
    tracks?: SongResponseDto[];
}

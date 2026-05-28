import { AlbumService } from './album.service';
import { AlbumResponseDto } from './dto/album-response.dto';
import { CreateAlbumDto } from './dto/create-album.dto';
export declare class AlbumController {
    private readonly albumService;
    constructor(albumService: AlbumService);
    create(createAlbumDto: CreateAlbumDto): Promise<AlbumResponseDto>;
    findAll(): Promise<AlbumResponseDto[]>;
    findOne(id: string): Promise<AlbumResponseDto>;
}

import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SongResponseDto } from '../../songs/dto/song-response.dto';

export class AlbumResponseDto {
  @ApiProperty({ description: 'The unique identifier of the album' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'The title of the album' })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'The artist of the album',
    required: false,
    nullable: true,
  })
  @Expose()
  artist: string;

  @ApiProperty({
    description: 'The URL to the cover image',
    required: false,
    nullable: true,
  })
  @Expose()
  coverUrl: string;

  @ApiProperty({
    type: () => [SongResponseDto],
    description: 'List of songs in the album',
    required: false,
  })
  @Expose()
  @Type(() => SongResponseDto)
  tracks?: SongResponseDto[];
}

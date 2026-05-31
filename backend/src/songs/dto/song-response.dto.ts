import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SongResponseDto {
  @ApiProperty({ description: 'The unique identifier of the song' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'The title of the song' })
  @Expose()
  title: string;

  @ApiProperty({
    description: 'The artist of the song',
    required: false,
    nullable: true,
  })
  @Expose()
  artist: string;

  @ApiProperty({ description: 'The URL to the audio file' })
  @Expose()
  url: string;

  @ApiProperty({
    description: 'The album ID this song belongs to',
    required: false,
    nullable: true,
  })
  @Expose()
  albumId: string;

  @ApiProperty({ description: 'The source type of the song (e.g., youtube)' })
  @Expose()
  sourceType: string;
}

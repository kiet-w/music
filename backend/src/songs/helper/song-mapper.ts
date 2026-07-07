import { Injectable } from '@nestjs/common';
import { SongResponseDto } from '../dto/song-response.dto';
import { Track } from '@prisma/client';

@Injectable()
export class SongMapper {
  private readonly YOUTUBE_ID_REGEX =
    /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;

  extractYoutubeId(url: string): string | undefined {
    const match = url.match(this.YOUTUBE_ID_REGEX);
    return match && match[1]?.length === 11 ? match[1] : undefined;
  }

  mapToResponse(song: Track): SongResponseDto {
    return {
      id: song.id,
      title: song.title,
      artist: song.artist,
      url: song.url,
      duration: song.duration,
      albumId: song.albumId,
      sourceType: song.sourceType,
      sourceId: song.sourceId,
      createdAt: song.createdAt,
    };
  }

  mapToResponseArray(songs: Track[]): SongResponseDto[] {
    return songs.map((song) => this.mapToResponse(song));
  }
}

import { Track } from '@prisma/client';
import { SongResponseDto } from '../dto/song-response.dto';

const YOUTUBE_ID_REGEX =
  /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#&?]*).*/;

// ponytail: pure functions, no class needed
export function extractYoutubeId(url: string): string | undefined {
  const match = url.match(YOUTUBE_ID_REGEX);
  return match && match[1]?.length === 11 ? match[1] : undefined;
}

export function mapSongToResponse(song: Track): SongResponseDto {
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

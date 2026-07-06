import { Track } from '@prisma/client';
import { YoutubeSongHelper } from './youtube-song.helper';

describe('YoutubeSongHelper', () => {
  let helper: YoutubeSongHelper;

  beforeEach(() => {
    helper = new YoutubeSongHelper();
  });

  describe('extractYoutubeId', () => {
    it.each([
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
      ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=abc', 'dQw4w9WgXcQ'],
    ])('extracts the 11-char video id from %s', (url, expected) => {
      expect(helper.extractYoutubeId(url)).toBe(expected);
    });

    it('returns undefined when no id is present', () => {
      expect(
        helper.extractYoutubeId('https://www.youtube.com/'),
      ).toBeUndefined();
    });

    it('returns undefined when the id is not exactly 11 characters', () => {
      expect(helper.extractYoutubeId('https://youtu.be/short')).toBeUndefined();
    });

    it('returns undefined for a non-youtube string', () => {
      expect(helper.extractYoutubeId('not a url')).toBeUndefined();
    });
  });

  describe('mapToResponse', () => {
    const track: Track = {
      id: 'song-1',
      title: 'Song Title',
      artist: 'Artist',
      url: 'https://storage/song.mp3',
      duration: 200,
      albumId: 'album-1',
      sourceType: 'youtube',
      sourceId: 'dQw4w9WgXcQ',
      userId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as Track;

    it('maps only the public response fields', () => {
      expect(helper.mapToResponse(track)).toEqual({
        id: 'song-1',
        title: 'Song Title',
        artist: 'Artist',
        url: 'https://storage/song.mp3',
        duration: 200,
        albumId: 'album-1',
        sourceType: 'youtube',
        sourceId: 'dQw4w9WgXcQ',
      });
    });

    it('does not leak internal fields such as userId', () => {
      expect(helper.mapToResponse(track)).not.toHaveProperty('userId');
    });
  });

  describe('mapToResponseArray', () => {
    it('maps every track in the array', () => {
      const tracks = [
        { id: 'a', title: 'A' },
        { id: 'b', title: 'B' },
      ] as unknown as Track[];

      const result = helper.mapToResponseArray(tracks);

      expect(result).toHaveLength(2);
      expect(result.map((song) => song.id)).toEqual(['a', 'b']);
    });

    it('returns an empty array for an empty input', () => {
      expect(helper.mapToResponseArray([])).toEqual([]);
    });
  });
});

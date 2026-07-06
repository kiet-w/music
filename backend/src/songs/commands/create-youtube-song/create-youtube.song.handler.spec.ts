import { BadRequestException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { CreateSongFromYoutubeHandler } from './create-youtube.song.handler';
import { CreateSongFromYoutubeCommand } from './create-youtube.song.command';
import { SongRepository } from '../../repositories/song.repository';
import { YoutubeSongHelper } from '../../helper/youtube-song.helper';
import { AlbumValidationHelper } from '../../helper/album-validation.helper';
import { PinoLogger } from 'nestjs-pino';

function createLogger(): PinoLogger {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
}

describe('CreateSongFromYoutubeHandler', () => {
  let handler: CreateSongFromYoutubeHandler;
  let songRepository: {
    findByYoutubeId: jest.Mock;
    create: jest.Mock;
  };
  let albumHelper: { getValidatedAlbumId: jest.Mock };
  let queue: { add: jest.Mock };
  const youtubeHelper = new YoutubeSongHelper();

  const userId = 'user-1';
  const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const youtubeId = 'dQw4w9WgXcQ';

  beforeEach(() => {
    songRepository = { findByYoutubeId: jest.fn(), create: jest.fn() };
    albumHelper = { getValidatedAlbumId: jest.fn() };
    queue = { add: jest.fn() };
    handler = new CreateSongFromYoutubeHandler(
      songRepository as unknown as SongRepository,
      youtubeHelper,
      albumHelper as unknown as AlbumValidationHelper,
      queue as unknown as Queue,
      createLogger(),
    );
  });

  it('validates the album id via the album helper', async () => {
    albumHelper.getValidatedAlbumId.mockResolvedValue('album-1');
    songRepository.findByYoutubeId.mockResolvedValue(null);
    songRepository.create.mockResolvedValue({ id: 'song-1', url: '' });

    await handler.execute(
      new CreateSongFromYoutubeCommand(
        userId,
        url,
        'Title',
        'Artist',
        'album-1',
      ),
    );

    expect(albumHelper.getValidatedAlbumId).toHaveBeenCalledWith(
      userId,
      'album-1',
    );
  });

  it('throws BadRequestException for an invalid youtube url', async () => {
    albumHelper.getValidatedAlbumId.mockResolvedValue('album-1');

    await expect(
      handler.execute(
        new CreateSongFromYoutubeCommand(
          userId,
          'https://www.youtube.com/',
          'Title',
        ),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(songRepository.create).not.toHaveBeenCalled();
  });

  describe('when no existing track is found', () => {
    beforeEach(() => {
      albumHelper.getValidatedAlbumId.mockResolvedValue('album-1');
      songRepository.findByYoutubeId.mockResolvedValue(null);
    });

    it('creates a pending song with an empty url and enqueues a conversion job', async () => {
      songRepository.create.mockResolvedValue({
        id: 'song-1',
        title: 'Title',
        url: '',
      });

      const result = await handler.execute(
        new CreateSongFromYoutubeCommand(
          userId,
          url,
          'Title',
          'Artist',
          'album-1',
        ),
      );

      expect(songRepository.create).toHaveBeenCalledWith({
        data: {
          title: 'Title',
          artist: 'Artist',
          url: '',
          albumId: 'album-1',
          userId,
          sourceType: 'youtube',
          sourceId: youtubeId,
        },
      });
      expect(queue.add).toHaveBeenCalledWith(
        'convert',
        { url, songId: 'song-1', userId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
      expect(result.id).toBe('song-1');
    });
  });

  describe('when an existing converted track is found', () => {
    it('reuses the stored url and duration and does not enqueue a job', async () => {
      albumHelper.getValidatedAlbumId.mockResolvedValue('album-1');
      songRepository.findByYoutubeId.mockResolvedValue({
        id: 'existing',
        artist: 'Original Artist',
        url: 'https://storage/existing.mp3',
        duration: 180,
      });
      songRepository.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve({ id: 'song-2', ...data }),
      );

      const result = await handler.execute(
        new CreateSongFromYoutubeCommand(
          userId,
          url,
          'New Title',
          undefined,
          'album-1',
        ),
      );

      expect(songRepository.create).toHaveBeenCalledWith({
        data: {
          title: 'New Title',
          artist: 'Original Artist',
          url: 'https://storage/existing.mp3',
          duration: 180,
          albumId: 'album-1',
          userId,
          sourceType: 'youtube',
          sourceId: youtubeId,
        },
      });
      expect(queue.add).not.toHaveBeenCalled();
      expect(result.url).toBe('https://storage/existing.mp3');
    });
  });
});

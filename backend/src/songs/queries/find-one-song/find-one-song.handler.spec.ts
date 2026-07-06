import { NotFoundException } from '@nestjs/common';
import { FindOneSongHandler } from './find-one-song.handler';
import { FindOneSongQuery } from './find-one-song.query';
import { SongRepository } from '../../repositories/song.repository';
import { YoutubeSongHelper } from '../../helper/youtube-song.helper';
import { PinoLogger } from 'nestjs-pino';

function createLogger(): PinoLogger {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
}

describe('FindOneSongHandler', () => {
  let handler: FindOneSongHandler;
  let songRepository: { findByUserAndId: jest.Mock };
  const youtubeHelper = new YoutubeSongHelper();

  const userId = 'user-1';
  const songId = 'song-1';

  beforeEach(() => {
    songRepository = { findByUserAndId: jest.fn() };
    handler = new FindOneSongHandler(
      songRepository as unknown as SongRepository,
      youtubeHelper,
      createLogger(),
    );
  });

  it('returns the mapped song when found', async () => {
    songRepository.findByUserAndId.mockResolvedValue({
      id: songId,
      title: 'Song',
    });

    const result = await handler.execute(new FindOneSongQuery(userId, songId));

    expect(songRepository.findByUserAndId).toHaveBeenCalledWith(userId, songId);
    expect(result.id).toBe(songId);
  });

  it('throws NotFoundException when the song is missing', async () => {
    songRepository.findByUserAndId.mockResolvedValue(null);

    await expect(
      handler.execute(new FindOneSongQuery(userId, songId)),
    ).rejects.toThrow(NotFoundException);
  });
});

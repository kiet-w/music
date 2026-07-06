import { NotFoundException } from '@nestjs/common';
import { RemoveSongHandler } from './remove-song.handler';
import { RemoveSongCommand } from './remove-song.command';
import { SongRepository } from '../../repositories/song.repository';
import { PinoLogger } from 'nestjs-pino';

function createLogger(): PinoLogger {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
}

describe('RemoveSongHandler', () => {
  let handler: RemoveSongHandler;
  let songRepository: { findByUserAndId: jest.Mock; delete: jest.Mock };

  const userId = 'user-1';
  const songId = 'song-1';

  beforeEach(() => {
    songRepository = { findByUserAndId: jest.fn(), delete: jest.fn() };
    handler = new RemoveSongHandler(
      songRepository as unknown as SongRepository,
      createLogger(),
    );
  });

  it('deletes the song when it belongs to the user', async () => {
    songRepository.findByUserAndId.mockResolvedValue({ id: songId });

    await handler.execute(new RemoveSongCommand(userId, songId));

    expect(songRepository.findByUserAndId).toHaveBeenCalledWith(userId, songId);
    expect(songRepository.delete).toHaveBeenCalledWith({
      where: { id: songId },
    });
  });

  it('throws NotFoundException and does not delete when the song is not found', async () => {
    songRepository.findByUserAndId.mockResolvedValue(null);

    await expect(
      handler.execute(new RemoveSongCommand(userId, songId)),
    ).rejects.toThrow(NotFoundException);
    expect(songRepository.delete).not.toHaveBeenCalled();
  });
});

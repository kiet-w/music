import { NotFoundException } from '@nestjs/common';
import { MoveSongToAlbumHandler } from './move-song-to-album.handler';
import { MoveSongToAlbumCommand } from './move-song-to-album.command';
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

describe('MoveSongToAlbumHandler', () => {
  let handler: MoveSongToAlbumHandler;
  let songRepository: { findByUserAndId: jest.Mock; update: jest.Mock };
  let albumHelper: { getValidatedAlbumId: jest.Mock };
  const youtubeHelper = new YoutubeSongHelper();

  const userId = 'user-1';
  const songId = 'song-1';
  const albumId = 'album-2';

  beforeEach(() => {
    songRepository = { findByUserAndId: jest.fn(), update: jest.fn() };
    albumHelper = { getValidatedAlbumId: jest.fn() };
    handler = new MoveSongToAlbumHandler(
      songRepository as unknown as SongRepository,
      youtubeHelper,
      albumHelper as unknown as AlbumValidationHelper,
      createLogger(),
    );
  });

  it('moves the song to the validated album', async () => {
    songRepository.findByUserAndId.mockResolvedValue({ id: songId });
    albumHelper.getValidatedAlbumId.mockResolvedValue(albumId);
    songRepository.update.mockResolvedValue({ id: songId, albumId });

    const result = await handler.execute(
      new MoveSongToAlbumCommand(userId, songId, albumId),
    );

    expect(albumHelper.getValidatedAlbumId).toHaveBeenCalledWith(
      userId,
      albumId,
    );
    expect(songRepository.update).toHaveBeenCalledWith({
      where: { id: songId },
      data: { albumId },
    });
    expect(result.albumId).toBe(albumId);
  });

  it('throws NotFoundException when the song does not belong to the user', async () => {
    songRepository.findByUserAndId.mockResolvedValue(null);

    await expect(
      handler.execute(new MoveSongToAlbumCommand(userId, songId, albumId)),
    ).rejects.toThrow(NotFoundException);
    expect(albumHelper.getValidatedAlbumId).not.toHaveBeenCalled();
    expect(songRepository.update).not.toHaveBeenCalled();
  });

  it('propagates NotFoundException when the target album is invalid', async () => {
    songRepository.findByUserAndId.mockResolvedValue({ id: songId });
    albumHelper.getValidatedAlbumId.mockRejectedValue(
      new NotFoundException('Album not found'),
    );

    await expect(
      handler.execute(new MoveSongToAlbumCommand(userId, songId, albumId)),
    ).rejects.toThrow(NotFoundException);
    expect(songRepository.update).not.toHaveBeenCalled();
  });
});

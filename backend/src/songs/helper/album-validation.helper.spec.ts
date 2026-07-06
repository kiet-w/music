import { NotFoundException } from '@nestjs/common';
import { AlbumValidationHelper } from './album-validation.helper';
import { AlbumRepository } from '../../albums/repositories/album.repository';
import { AlbumService } from '../../albums/album.service';
import { PinoLogger } from 'nestjs-pino';

function createLogger(): PinoLogger {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
}

describe('AlbumValidationHelper', () => {
  let helper: AlbumValidationHelper;
  let albumRepository: { findUnique: jest.Mock };
  let albumService: { findOrCreateDefault: jest.Mock };

  const userId = 'user-1';

  beforeEach(() => {
    albumRepository = { findUnique: jest.fn() };
    albumService = { findOrCreateDefault: jest.fn() };
    helper = new AlbumValidationHelper(
      albumRepository as unknown as AlbumRepository,
      albumService as unknown as AlbumService,
      createLogger(),
    );
  });

  describe('when an albumId is provided', () => {
    it('returns the albumId when the album belongs to the user', async () => {
      albumRepository.findUnique.mockResolvedValue({
        id: 'album-1',
        userId,
      });

      await expect(helper.getValidatedAlbumId(userId, 'album-1')).resolves.toBe(
        'album-1',
      );
      expect(albumRepository.findUnique).toHaveBeenCalledWith({
        where: { id: 'album-1' },
      });
      expect(albumService.findOrCreateDefault).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the album does not exist', async () => {
      albumRepository.findUnique.mockResolvedValue(null);

      await expect(
        helper.getValidatedAlbumId(userId, 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when the album belongs to another user', async () => {
      albumRepository.findUnique.mockResolvedValue({
        id: 'album-1',
        userId: 'someone-else',
      });

      await expect(
        helper.getValidatedAlbumId(userId, 'album-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('when no albumId is provided', () => {
    it('falls back to the default album', async () => {
      albumService.findOrCreateDefault.mockResolvedValue({ id: 'default-1' });

      await expect(helper.getValidatedAlbumId(userId)).resolves.toBe(
        'default-1',
      );
      expect(albumService.findOrCreateDefault).toHaveBeenCalledWith(userId);
      expect(albumRepository.findUnique).not.toHaveBeenCalled();
    });
  });
});

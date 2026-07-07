import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { MoveSongToAlbumCommand } from './move-song-to-album.command';
import { SongResponseDto } from '../../dto/song-response.dto';
import { SongRepository } from '../../repositories/song.repository';
import { SongMapper } from '../../helper/song-mapper';
import { AlbumValidationHelper } from '../../helper/album-validation.helper';

@CommandHandler(MoveSongToAlbumCommand)
export class MoveSongToAlbumHandler
  implements ICommandHandler<MoveSongToAlbumCommand, SongResponseDto>
{
  constructor(
    private readonly songRepository: SongRepository,
    private readonly songMapper: SongMapper,
    private readonly albumHelper: AlbumValidationHelper,
    @InjectPinoLogger(MoveSongToAlbumHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(command: MoveSongToAlbumCommand): Promise<SongResponseDto> {
    const { userId, id, albumId } = command;

    this.logger.info({ userId, id, albumId }, 'Moving song to album');

    const song = await this.songRepository.findByUserAndId(userId, id);
    if (!song) {
      this.logger.warn({ userId, id }, 'Song not found or access denied');
      throw new NotFoundException('Song not found');
    }

    const validatedAlbumId = await this.albumHelper.getValidatedAlbumId(
      userId,
      albumId,
    );

    const updatedSong = await this.songRepository.update({
      where: { id },
      data: { albumId: validatedAlbumId },
    });

    return this.songMapper.mapToResponse(updatedSong);
  }
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { RemoveSongCommand } from './remove-song.command';
import { SongRepository } from '../../repositories/song.repository';

@CommandHandler(RemoveSongCommand)
export class RemoveSongHandler
  implements ICommandHandler<RemoveSongCommand, void>
{
  constructor(
    private readonly songRepository: SongRepository,
    @InjectPinoLogger(RemoveSongHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(command: RemoveSongCommand): Promise<void> {
    const { userId, id } = command;

    this.logger.info({ userId, id }, 'Removing song');

    const song = await this.songRepository.findByUserAndId(userId, id);
    if (!song) {
      this.logger.warn({ userId, id }, 'Song not found or access denied');
      throw new NotFoundException('Song not found');
    }

    await this.songRepository.delete({ where: { id } });
  }
}

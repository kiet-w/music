import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { RemoveSongCommand } from './remove-song.command';
import { SongRepository } from '../../repositories/song.repository';

@CommandHandler(RemoveSongCommand)
export class RemoveSongHandler
  implements ICommandHandler<RemoveSongCommand, void>
{
  constructor(
    private readonly songRepository: SongRepository,
    @InjectQueue('conversion') private readonly conversionQueue: Queue,
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

    // Cancel pending conversion job if one exists
    if (!song.url) {
      // ponytail: O(n) scan, BullMQ has no filter by job.data — accept until queue grows
      const pendingJobs = await this.conversionQueue.getJobs(['waiting', 'delayed']);
      const relatedJob = pendingJobs.find((job) => job.data.songId === id);
      if (relatedJob) {
        this.logger.info({ jobId: relatedJob.id, songId: id }, 'Cancelling pending conversion job');
        await relatedJob.remove();
      }
    }

    await this.songRepository.delete({ where: { id } });
  }
}

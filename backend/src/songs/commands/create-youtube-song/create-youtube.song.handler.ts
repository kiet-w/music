import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Track } from '@prisma/client';

import { CreateSongFromYoutubeCommand } from './create-youtube.song.command';
import { SongResponseDto } from '../../dto/song-response.dto';
import { SongRepository } from '../../repositories/song.repository';
import { SongMapper } from '../../helper/song-mapper';
import { AlbumValidationHelper } from '../../helper/album-validation.helper';
import {
  CONVERSION_JOB,
  SONG_SOURCE_TYPE,
} from '../../constants/song.constants';

@CommandHandler(CreateSongFromYoutubeCommand)
export class CreateSongFromYoutubeHandler
  implements ICommandHandler<CreateSongFromYoutubeCommand, SongResponseDto>
{
  constructor(
    private readonly songRepository: SongRepository,
    private readonly songMapper: SongMapper,
    private readonly albumHelper: AlbumValidationHelper,
    @InjectQueue('conversion') private readonly conversionQueue: Queue,
    @InjectPinoLogger(CreateSongFromYoutubeHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(
    command: CreateSongFromYoutubeCommand,
  ): Promise<SongResponseDto> {
    const { userId, url, title, artist, albumId } = command;

    this.logger.info(
      { userId, url, title, artist, albumId },
      'Creating song from Youtube',
    );

    const finalAlbumId = await this.albumHelper.getValidatedAlbumId(
      userId,
      albumId,
    );
    const youtubeId = this.songMapper.extractYoutubeId(url);

    if (!youtubeId) {
      this.logger.warn({ url }, 'Invalid YouTube URL or missing Video ID');
      throw new BadRequestException('Invalid YouTube URL');
    }

    // 1. Reuse completed track if available
    const existingTrack = await this.songRepository.findByYoutubeId(youtubeId);
    if (existingTrack) {
      this.logger.info(
        { youtubeId, existingTrackId: existingTrack.id },
        'Found completed track, reusing storage URL',
      );
      const reusedSong = await this.songRepository.create({
        data: {
          title,
          artist: artist || existingTrack.artist,
          url: existingTrack.url,
          duration: existingTrack.duration,
          albumId: finalAlbumId,
          userId,
          sourceType: SONG_SOURCE_TYPE.YOUTUBE,
          sourceId: youtubeId,
        },
      });
      return this.songMapper.mapToResponse(reusedSong);
    }

    // 2. Check if another request already claimed this youtubeId (race guard)
    const pendingTrack = await this.songRepository.findPendingByYoutubeId(
      youtubeId,
    );
    if (pendingTrack) {
      this.logger.info(
        { youtubeId, pendingTrackId: pendingTrack.id },
        'Another request already converting this YouTube ID, reusing pending record',
      );
      const reusedSong = await this.songRepository.create({
        data: {
          title,
          artist: artist || pendingTrack.artist,
          url: pendingTrack.url,
          duration: pendingTrack.duration,
          albumId: finalAlbumId,
          userId,
          sourceType: SONG_SOURCE_TYPE.YOUTUBE,
          sourceId: youtubeId,
        },
      });
      return this.songMapper.mapToResponse(reusedSong);
    }

    // 3. No existing track — create pending and enqueue with dedup jobId
    const song = await this.createPendingSong(
      userId,
      title,
      artist,
      finalAlbumId,
      youtubeId,
    );

    // Double-check: another request may have slipped in between
    // findByYoutubeId and createPendingSong. If so, clean up our duplicate.
    const raceCheck = await this.songRepository.findPendingByYoutubeId(
      youtubeId,
    );
    if (raceCheck && raceCheck.id !== song.id) {
      this.logger.warn(
        { youtubeId, ourId: song.id, winnerId: raceCheck.id },
        'Lost race condition, removing duplicate pending record',
      );
      await this.songRepository.delete({ where: { id: song.id } });
      // ponytail: return winner's data, no new DB write needed
      return this.songMapper.mapToResponse(raceCheck);
    }

    await this.enqueueConversionJob(userId, url, song.id, youtubeId);

    return this.songMapper.mapToResponse(song);
  }

  // --- Private helpers ---

  private createPendingSong(
    userId: string,
    title: string,
    artist: string | undefined,
    albumId: string,
    youtubeId: string | undefined,
  ): Promise<Track> {
    return this.songRepository.create({
      data: {
        title,
        artist,
        url: '',
        albumId,
        userId,
        sourceType: SONG_SOURCE_TYPE.YOUTUBE,
        sourceId: youtubeId,
      },
    });
  }

  private async enqueueConversionJob(
    userId: string,
    url: string,
    songId: string,
    youtubeId: string,
  ): Promise<void> {
    this.logger.info(
      { songId, youtubeId },
      'Song record created, adding to conversion queue',
    );

    await this.conversionQueue.add(
      CONVERSION_JOB.NAME,
      { url, songId, userId },
      {
        jobId: `convert:${youtubeId}`,
        attempts: CONVERSION_JOB.MAX_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: CONVERSION_JOB.BACKOFF_DELAY_MS,
        },
      },
    );
  }
}

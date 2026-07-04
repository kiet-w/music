import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Track } from '@prisma/client';

import { CreateSongFromYoutubeCommand } from './create-youtube.song.command';
import { SongResponseDto } from '../../dto/song-response.dto';
import { SongRepository } from '../../repositories/song.repository';
import { YoutubeSongHelper } from '../../helper/youtube-song.helper';
import { AlbumValidationHelper } from '../../helper/album-validation.helper';
import {
  CONVERSION_JOB,
  SONG_SOURCE_TYPE,
} from '../../constants/song.constants';

// --- Types nội bộ cho Handler này ---
interface ReuseTrackParams {
  userId: string;
  youtubeId: string;
  title: string;
  artist: string | undefined;
  albumId: string;
}

@CommandHandler(CreateSongFromYoutubeCommand)
export class CreateSongFromYoutubeHandler
  implements ICommandHandler<CreateSongFromYoutubeCommand, SongResponseDto>
{
  constructor(
    private readonly songRepository: SongRepository,
    private readonly youtubeHelper: YoutubeSongHelper,
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
    const youtubeId = this.youtubeHelper.extractYoutubeId(url);

    if (youtubeId) {
      const reusedSong = await this.tryReuseExistingTrack({
        userId,
        youtubeId,
        title,
        artist,
        albumId: finalAlbumId,
      });
      if (reusedSong) {
        return this.youtubeHelper.mapToResponse(reusedSong);
      }
    }

    const song = await this.createPendingSong(
      userId,
      title,
      artist,
      finalAlbumId,
      youtubeId,
    );

    await this.enqueueConversionJob(userId, url, song.id);

    return this.youtubeHelper.mapToResponse(song);
  }

  // --- Private helpers ---

  private async tryReuseExistingTrack(
    params: ReuseTrackParams,
  ): Promise<Track | null> {
    const { userId, youtubeId, title, artist, albumId } = params;

    const existingTrack = await this.songRepository.findByYoutubeId(youtubeId);
    if (!existingTrack) return null;

    this.logger.info(
      { youtubeId, existingTrackId: existingTrack.id },
      'Found existing track for YouTube ID, reusing storage URL',
    );

    return this.songRepository.create({
      data: {
        title,
        artist: artist || existingTrack.artist,
        url: existingTrack.url,
        duration: existingTrack.duration,
        albumId,
        userId,
        sourceType: SONG_SOURCE_TYPE.YOUTUBE,
        sourceId: youtubeId,
      },
    });
  }

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
  ): Promise<void> {
    this.logger.info(
      { songId },
      'Song record created, adding to conversion queue',
    );

    await this.conversionQueue.add(
      CONVERSION_JOB.NAME,
      { url, songId, userId },
      {
        attempts: CONVERSION_JOB.MAX_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: CONVERSION_JOB.BACKOFF_DELAY_MS,
        },
      },
    );
  }
}

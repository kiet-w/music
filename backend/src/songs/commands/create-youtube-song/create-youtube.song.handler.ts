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
      const reusedSong = await this.tryReuseExistingTrack(
        userId,
        youtubeId,
        title,
        artist,
        finalAlbumId,
      );
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

  private async tryReuseExistingTrack(
    userId: string,
    youtubeId: string,
    title: string,
    artist: string | undefined,
    albumId: string,
  ): Promise<Track | null> {
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
        sourceType: 'youtube',
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
        sourceType: 'youtube',
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
      'convert',
      { url, songId, userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    );
  }
}

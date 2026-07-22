import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { SongRepository } from './repositories/song.repository';
import { extractYoutubeId, mapSongToResponse } from './helper/song-mapper';
import { AlbumValidationHelper } from './helper/album-validation.helper';
import { SongResponseDto } from './dto/song-response.dto';
import { CreateSongYoutubeDto } from './dto/create-song-youtube.dto';
import { MoveSongDto } from './dto/move-song.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CONVERSION_JOB } from './constants/song.constants';

import { DownloaderService } from '../downloader/services/downloader.service';

@Injectable()
export class SongsService {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly albumHelper: AlbumValidationHelper,
    @InjectQueue('conversion') private readonly conversionQueue: Queue,
    @InjectPinoLogger(SongsService.name) private readonly logger: PinoLogger,
    private readonly downloaderService: DownloaderService,
  ) {}

  // --- CREATE ---

  async getYoutubeInfo(url: string) {
    this.logger.info({ url }, 'Fetching YouTube info');
    return this.downloaderService.getVideoInfo(url);
  }

  async createFromYoutube(
    userId: string,
    dto: CreateSongYoutubeDto,
  ): Promise<SongResponseDto> {
    const { url, title, artist, albumId } = dto;

    this.logger.info({ userId, url, title, artist, albumId }, 'Creating song from Youtube');

    const finalAlbumId = await this.albumHelper.getValidatedAlbumId(userId, albumId);
    const youtubeId = extractYoutubeId(url);

    if (!youtubeId) {
      this.logger.warn({ url }, 'Invalid YouTube URL or missing Video ID');
      throw new BadRequestException('Invalid YouTube URL');
    }

    // 1. Reuse completed track if available
    const existingTrack = await this.songRepository.findByYoutubeId(youtubeId);
    if (existingTrack) {
      this.logger.info({ youtubeId, existingTrackId: existingTrack.id }, 'Found completed track, reusing storage URL');
      const reusedSong = await this.songRepository.create({
        data: {
          title,
          artist: artist || existingTrack.artist,
          url: existingTrack.url,
          duration: existingTrack.duration,
          albumId: finalAlbumId,
          userId,
          sourceType: 'youtube',
          sourceId: youtubeId,
        },
      });
      return mapSongToResponse(reusedSong);
    }

    // 2. Check if another request already claimed this youtubeId (race guard)
    const pendingTrack = await this.songRepository.findPendingByYoutubeId(youtubeId);
    if (pendingTrack) {
      this.logger.info({ youtubeId, pendingTrackId: pendingTrack.id }, 'Another request already converting this YouTube ID, reusing pending record');
      const reusedSong = await this.songRepository.create({
        data: {
          title,
          artist: artist || pendingTrack.artist,
          url: pendingTrack.url,
          duration: pendingTrack.duration,
          albumId: finalAlbumId,
          userId,
          sourceType: 'youtube',
          sourceId: youtubeId,
        },
      });
      return mapSongToResponse(reusedSong);
    }

    // 3. No existing track — create pending and enqueue
    const song = await this.songRepository.create({
      data: {
        title,
        artist,
        url: '',
        albumId: finalAlbumId,
        userId,
        sourceType: 'youtube',
        sourceId: youtubeId,
      },
    });

    // Double-check: another request may have slipped in between findPendingByYoutubeId
    // and create. If so, clean up our duplicate.
    const raceCheck = await this.songRepository.findPendingByYoutubeId(youtubeId);
    if (raceCheck && raceCheck.id !== song.id) {
      this.logger.warn({ youtubeId, ourId: song.id, winnerId: raceCheck.id }, 'Lost race condition, removing duplicate pending record');
      await this.songRepository.delete({ where: { id: song.id } });
      // ponytail: return winner's data, no new DB write needed
      return mapSongToResponse(raceCheck);
    }

    this.logger.info({ songId: song.id, youtubeId }, 'Song record created, adding to conversion queue');
    await this.conversionQueue.add(
      CONVERSION_JOB.NAME,
      { url, songId: song.id, userId },
      {
        jobId: `convert-${youtubeId}-${song.id}`,
        attempts: CONVERSION_JOB.MAX_ATTEMPTS,
        backoff: { type: 'exponential', delay: CONVERSION_JOB.BACKOFF_DELAY_MS },
      },
    );

    return mapSongToResponse(song);
  }

  // --- READ ---

  async findAll(userId: string, paginationDto: PaginationDto) {
    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;

    let orderBy: any = { createdAt: 'desc' };
    if (paginationDto.sort) orderBy = { [paginationDto.sort]: 'asc' };

    const where: any = { userId };
    if (paginationDto.albumId) where.albumId = paginationDto.albumId;

    const [total, songs] = await Promise.all([
      this.songRepository.count({ where }),
      this.songRepository.findAllByUser(userId, skip, limit, orderBy, where),
    ]);

    return {
      data: songs.map(mapSongToResponse), // ponytail: inline, no need for mapToResponseArray method
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(userId: string, id: string): Promise<SongResponseDto> {
    const song = await this.songRepository.findByUserAndId(userId, id);
    if (!song) {
      this.logger.warn({ userId, id }, 'Song not found or access denied');
      throw new NotFoundException('Song not found');
    }
    return mapSongToResponse(song);
  }

  // --- DELETE ---

  async remove(userId: string, id: string): Promise<void> {
    this.logger.info({ userId, id }, 'Removing song');

    const song = await this.songRepository.findByUserAndId(userId, id);
    if (!song) {
      this.logger.warn({ userId, id }, 'Song not found or access denied');
      throw new NotFoundException('Song not found');
    }

    // Cancel pending conversion job if one exists
    if (!song.url) {
      // ponytail: O(n) scan — BullMQ has no filter by job.data. Accept until queue grows large.
      const pendingJobs = await this.conversionQueue.getJobs(['waiting', 'delayed']);
      const relatedJob = pendingJobs.find((job) => job.data.songId === id);
      if (relatedJob) {
        this.logger.info({ jobId: relatedJob.id, songId: id }, 'Cancelling pending conversion job');
        await relatedJob.remove();
      }
    }

    await this.songRepository.delete({ where: { id } });
  }

  // --- MOVE ---

  async moveToAlbum(
    userId: string,
    id: string,
    dto: MoveSongDto,
  ): Promise<SongResponseDto> {
    this.logger.info({ userId, id, albumId: dto.albumId }, 'Moving song to album');

    const song = await this.songRepository.findByUserAndId(userId, id);
    if (!song) {
      this.logger.warn({ userId, id }, 'Song not found or access denied');
      throw new NotFoundException('Song not found');
    }

    const validatedAlbumId = await this.albumHelper.getValidatedAlbumId(userId, dto.albumId);

    const updatedSong = await this.songRepository.update({
      where: { id },
      data: { albumId: validatedAlbumId },
    });

    return mapSongToResponse(updatedSong);
  }
}

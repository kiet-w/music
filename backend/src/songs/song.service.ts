import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { TrackStatus } from '@prisma/client';
import { SongRepository } from './repositories/song.repository';
import { AlbumRepository } from '../albums/repositories/album.repository';
import { DownloaderService } from '../downloader/downloader.service';

@Injectable()
export class SongService {
  constructor(
    private songRepository: SongRepository,
    private albumRepository: AlbumRepository,
    private downloaderService: DownloaderService,
    @InjectQueue('conversion') private conversionQueue: Queue,
  ) {}

  async createFromYoutube(
    url: string,
    title: string,
    artist?: string,
    albumId?: string,
  ) {
    let finalAlbumId = albumId;

    if (!finalAlbumId) {
      let defaultAlbum = await this.albumRepository
        .findMany({
          where: { title: 'Default' },
          take: 1,
        })
        .then((albums) => albums[0]);

      if (!defaultAlbum) {
        defaultAlbum = await this.albumRepository.create({
          data: { title: 'Default', artist: 'Various Artists' },
        });
      }
      finalAlbumId = defaultAlbum.id;
    }

    // Task 1: Fetch metadata early to provide a better UI experience
    // Use the provided title if available, otherwise get it from yt-dlp
    let finalTitle = title;
    let duration: number | null = null;

    try {
      const metadata = await this.downloaderService.getMetadata(url);
      if (!finalTitle || finalTitle === 'Processing...') {
        finalTitle = metadata.title;
      }
      duration = metadata.duration;
    } catch (error) {
      console.error('Metadata fetch failed:', error);
    }

    const song = await this.songRepository.create({
      data: {
        title: finalTitle,
        artist,
        url: '',
        duration,
        albumId: finalAlbumId,
        status: TrackStatus.PROCESSING,
        sourceType: 'youtube',
      },
    });

    await this.conversionQueue.add('convert', {
      url,
      songId: song.id,
    });

    return song;
  }

  async findAll(albumId?: string) {
    return this.songRepository.findMany({
      where: albumId ? { albumId } : {},
      include: { album: true },
    });
  }

  async findOne(id: string) {
    return this.songRepository.findUnique({
      where: { id },
      include: { album: true },
    });
  }

  async remove(id: string) {
    const song = await this.songRepository.findUnique({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    return this.songRepository.delete({
      where: { id },
    });
  }

  async moveToAlbum(id: string, albumId: string) {
    const song = await this.songRepository.findUnique({ where: { id } });
    if (!song) {
      throw new NotFoundException('Song not found');
    }
    return this.songRepository.update({
      where: { id },
      data: { albumId },
    });
  }
}

import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { FindOneSongQuery } from './find-one-song.query';
import { SongResponseDto } from '../../dto/song-response.dto';
import { SongRepository } from '../../repositories/song.repository';
import { SongMapper } from '../../helper/song-mapper';

@QueryHandler(FindOneSongQuery)
export class FindOneSongHandler implements IQueryHandler<FindOneSongQuery> {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly songMapper: SongMapper,
    @InjectPinoLogger(FindOneSongHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(query: FindOneSongQuery): Promise<SongResponseDto> {
    const { userId, id } = query;

    const song = await this.songRepository.findByUserAndId(userId, id);
    if (!song) {
      this.logger.warn({ userId, id }, 'Song not found or access denied');
      throw new NotFoundException('Song not found');
    }

    return this.songMapper.mapToResponse(song);
  }
}

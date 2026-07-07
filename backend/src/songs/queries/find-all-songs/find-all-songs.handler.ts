import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

import { FindAllSongsQuery } from './find-all-songs.query';
import { SongResponseDto } from '../../dto/song-response.dto';
import { SongRepository } from '../../repositories/song.repository';
import { SongMapper } from '../../helper/song-mapper';

@QueryHandler(FindAllSongsQuery)
export class FindAllSongsHandler implements IQueryHandler<FindAllSongsQuery> {
  constructor(
    private readonly songRepository: SongRepository,
    private readonly songMapper: SongMapper,
    @InjectPinoLogger(FindAllSongsHandler.name)
    private readonly logger: PinoLogger,
  ) {}

  async execute(
    query: FindAllSongsQuery,
  ): Promise<{
    data: SongResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { userId, paginationDto } = query;

    const page = paginationDto.page || 1;
    const limit = paginationDto.limit || 10;
    const skip = (page - 1) * limit;
    const take = limit;

    this.logger.debug({ userId, skip, take }, 'Finding all songs for user');

    let orderBy: any = { createdAt: 'desc' };
    if (paginationDto.sort) {
      orderBy = { [paginationDto.sort]: 'asc' };
    }

    const [total, songs] = await Promise.all([
      this.songRepository.countByUser(userId),
      this.songRepository.findAllByUser(userId, skip, take, orderBy),
    ]);

    return {
      data: this.songMapper.mapToResponseArray(songs),
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }
}

import { FindAllSongsHandler } from './find-all-songs.handler';
import { FindAllSongsQuery } from './find-all-songs.query';
import { SongRepository } from '../../repositories/song.repository';
import { YoutubeSongHelper } from '../../helper/youtube-song.helper';
import { PaginationDto } from '../../../common/dto/pagination.dto';
import { PinoLogger } from 'nestjs-pino';

function createLogger(): PinoLogger {
  return {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as PinoLogger;
}

function pagination(overrides: Partial<PaginationDto> = {}): PaginationDto {
  return Object.assign(new PaginationDto(), overrides);
}

describe('FindAllSongsHandler', () => {
  let handler: FindAllSongsHandler;
  let songRepository: { countByUser: jest.Mock; findAllByUser: jest.Mock };
  const youtubeHelper = new YoutubeSongHelper();

  const userId = 'user-1';

  beforeEach(() => {
    songRepository = { countByUser: jest.fn(), findAllByUser: jest.fn() };
    handler = new FindAllSongsHandler(
      songRepository as unknown as SongRepository,
      youtubeHelper,
      createLogger(),
    );
  });

  it('returns paginated songs with computed metadata', async () => {
    songRepository.countByUser.mockResolvedValue(25);
    songRepository.findAllByUser.mockResolvedValue([
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
    ]);

    const result = await handler.execute(
      new FindAllSongsQuery(userId, pagination({ page: 2, limit: 10 })),
    );

    expect(songRepository.findAllByUser).toHaveBeenCalledWith(userId, 10, 10, {
      createdAt: 'desc',
    });
    expect(result).toMatchObject({
      total: 25,
      page: 2,
      limit: 10,
      totalPages: 3,
    });
    expect(result.data.map((s) => s.id)).toEqual(['a', 'b']);
  });

  it('defaults to page 1 with a limit of 10 (skip 0)', async () => {
    songRepository.countByUser.mockResolvedValue(0);
    songRepository.findAllByUser.mockResolvedValue([]);

    const result = await handler.execute(
      new FindAllSongsQuery(userId, pagination()),
    );

    expect(songRepository.findAllByUser).toHaveBeenCalledWith(userId, 0, 10, {
      createdAt: 'desc',
    });
    expect(result.totalPages).toBe(0);
  });

  it('orders ascending by the requested sort field', async () => {
    songRepository.countByUser.mockResolvedValue(1);
    songRepository.findAllByUser.mockResolvedValue([]);

    await handler.execute(
      new FindAllSongsQuery(userId, pagination({ sort: 'title' })),
    );

    expect(songRepository.findAllByUser).toHaveBeenCalledWith(userId, 0, 10, {
      title: 'asc',
    });
  });
});

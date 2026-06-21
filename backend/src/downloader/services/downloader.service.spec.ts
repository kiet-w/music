import { Test, TestingModule } from '@nestjs/testing';
import { DownloaderService } from './downloader.service';
import { execFile } from 'child_process';
import { getLoggerToken } from 'nestjs-pino';
import * as fs from 'fs';

jest.mock('child_process', () => ({
  execFile: jest.fn(),
}));

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
}));

describe('DownloaderService', () => {
  let service: DownloaderService;
  const execFileMock = execFile as unknown as jest.Mock;

  const mockPinoLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DownloaderService,
        {
          provide: getLoggerToken(DownloaderService.name),
          useValue: mockPinoLogger,
        },
      ],
    }).compile();

    service = module.get<DownloaderService>(DownloaderService);
    execFileMock.mockReset();
    (fs.existsSync as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('downloads mp3 at 320kbps with safe optimized flags', async () => {
    execFileMock.mockImplementation(
      (
        file: string,
        args: string[],
        callback: (error: null, stdout: string, stderr: string) => void,
      ) => {
        callback(null, '', '');
      },
    );
    (fs.existsSync as jest.Mock).mockReturnValue(false); // mock no cookies.txt

    await service.download('https://youtube.com/watch?v=123', '/tmp/song.mp3');

    expect(execFileMock).toHaveBeenCalledWith(
      './yt-dlp',
      [
        '-f',
        'bestaudio/best',
        '--extractor-args',
        'youtube:player_client=android',
        '--no-playlist',
        '--retries',
        '3',
        '--fragment-retries',
        '3',
        '--socket-timeout',
        '30',
        '-x',
        '--audio-format',
        'mp3',
        '--audio-quality',
        '320K',
        '--ffmpeg-location',
        expect.any(String),
        '-o',
        '/tmp/song.mp3',
        'https://youtube.com/watch?v=123',
      ],
      expect.any(Function),
    );
  });
});

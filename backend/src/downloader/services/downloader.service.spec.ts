import { Test, TestingModule } from '@nestjs/testing';
import { DownloaderService } from './downloader.service';
import { exec } from 'child_process';
import { getLoggerToken } from 'nestjs-pino';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

describe('DownloaderService', () => {
  let service: DownloaderService;
  const execMock = exec as unknown as jest.Mock;

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
    execMock.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('downloads mp3 at 320kbps with safe optimized flags', async () => {
    execMock.mockImplementation((command: string, callback: (error: null, stdout: string, stderr: string) => void) => {
      callback(null, '', '');
    });

    await service.download('https://youtube.com/watch?v=123', '/tmp/song.mp3');

    const expectedCommand = `yt-dlp -f "bestaudio/best" --extractor-args "youtube:player_client=web" --no-playlist --retries 3 --fragment-retries 3 --socket-timeout 30 -x --audio-format mp3 --audio-quality 320K -o "/tmp/song.mp3" "https://youtube.com/watch?v=123"`;
    
    expect(execMock).toHaveBeenCalledWith(
      expectedCommand,
      expect.any(Function),
    );
  });
});

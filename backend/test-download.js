const { execFile } = require('child_process');
const { promisify } = require('util');
const ffmpegStatic = require('ffmpeg-static');

const execFileAsync = promisify(execFile);

async function test() {
  try {
    const url = 'https://www.youtube.com/watch?v=BaW_jenozKc'; // short video
    const outputPath = 'test.mp3';
    console.log('ffmpeg path:', ffmpegStatic);
    
    const args = [
        '-f', 'bestaudio/best',
        '--no-playlist',
        '--fragment-retries', '3',
        '--socket-timeout', '30',
        '-x',
        '--audio-format', 'mp3',
        '--audio-quality', '320K',
        '--ffmpeg-location', ffmpegStatic,
        '--cookies', 'cookies.txt',
        '-o', outputPath,
        url,
    ];
    console.log('Running yt-dlp...');
    const { stdout, stderr } = await execFileAsync('./yt-dlp', args);
    console.log('stdout:', stdout);
    console.log('stderr:', stderr);
  } catch (err) {
    console.error('Error:', err);
  }
}
test(); 

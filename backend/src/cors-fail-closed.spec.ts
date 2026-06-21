import { exec } from 'child_process';
import * as path from 'path';

describe('CORS Fail-Closed Integration', () => {
  const mainPath = path.resolve(__dirname, '../dist/main.js');

  it('should crash and exit with error when CORS_ORIGINS is missing', (done) => {
    const env = { ...process.env } as any;
    delete env.CORS_ORIGINS;

    exec(`node ${mainPath}`, { env, timeout: 5000 }, (error, stdout, stderr) => {
      expect(error).not.toBeNull();
      expect(stderr).toContain('CORS_ORIGINS environment variable is missing');
      done();
    });
  }, 10000);

  it('should crash and exit with error when CORS_ORIGINS is empty', (done) => {
    const env = { ...process.env, CORS_ORIGINS: '' } as any;

    exec(`node ${mainPath}`, { env, timeout: 5000 }, (error, stdout, stderr) => {
      expect(error).not.toBeNull();
      expect(stderr).toContain('CORS_ORIGINS environment variable is missing');
      done();
    });
  }, 10000);

  it('should crash and exit with error when CORS_ORIGINS has only commas and spaces', (done) => {
    const env = { ...process.env, CORS_ORIGINS: ' , , ' } as any;

    exec(`node ${mainPath}`, { env, timeout: 5000 }, (error, stdout, stderr) => {
      expect(error).not.toBeNull();
      expect(stderr).toContain('CORS_ORIGINS environment variable is empty');
      done();
    });
  }, 10000);
});

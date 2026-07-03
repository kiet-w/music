import { IsYouTubeUrlConstraint } from './is-youtube-url.validator';

describe('IsYouTubeUrlConstraint', () => {
  const validator = new IsYouTubeUrlConstraint();

  it('should accept valid YouTube URLs', () => {
    expect(
      validator.validate('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    ).toBe(true);
    expect(validator.validate('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
    expect(validator.validate('https://music.youtube.com/watch?v=abc')).toBe(
      true,
    );
    expect(validator.validate('https://m.youtube.com/watch?v=xyz')).toBe(true);
    expect(validator.validate('https://www.youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('should reject non-YouTube URLs', () => {
    expect(validator.validate('https://evil.com/exploit')).toBe(false);
    expect(validator.validate('http://169.254.169.254/latest/meta-data/')).toBe(
      false,
    );
    expect(validator.validate('http://localhost:3000/admin')).toBe(false);
    expect(validator.validate('ftp://youtube.com/video')).toBe(false);
  });

  it('should reject non-string values', () => {
    expect(validator.validate(null)).toBe(false);
    expect(validator.validate(123)).toBe(false);
    expect(validator.validate(undefined)).toBe(false);
  });
});

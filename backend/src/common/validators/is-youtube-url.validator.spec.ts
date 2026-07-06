import { IsYouTubeUrlConstraint } from './is-youtube-url.validator';

describe('IsYouTubeUrlConstraint', () => {
  let constraint: IsYouTubeUrlConstraint;

  beforeEach(() => {
    constraint = new IsYouTubeUrlConstraint();
  });

  describe('validate', () => {
    it.each([
      'https://youtube.com/watch?v=dQw4w9WgXcQ',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://youtu.be/dQw4w9WgXcQ',
      'http://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ])('accepts allowed host %s', (url) => {
      expect(constraint.validate(url)).toBe(true);
    });

    it('is case-insensitive on the hostname', () => {
      expect(
        constraint.validate('https://WWW.YouTube.com/watch?v=dQw4w9WgXcQ'),
      ).toBe(true);
    });

    it('rejects non-whitelisted hosts', () => {
      expect(constraint.validate('https://vimeo.com/12345')).toBe(false);
    });

    it('rejects a lookalike host that only contains youtube', () => {
      expect(constraint.validate('https://youtube.com.evil.com/x')).toBe(false);
    });

    it('rejects unsupported protocols', () => {
      expect(constraint.validate('ftp://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
        false,
      );
    });

    it('rejects malformed urls', () => {
      expect(constraint.validate('not a url')).toBe(false);
    });

    it.each([undefined, null, 42, {}])(
      'rejects non-string value %p',
      (value) => {
        expect(constraint.validate(value as string)).toBe(false);
      },
    );
  });

  describe('defaultMessage', () => {
    it('returns a helpful message', () => {
      expect(constraint.defaultMessage()).toContain('YouTube URL');
    });
  });
});

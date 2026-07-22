import { describe, it, expect } from 'vitest';
import { isSafeUrl, sanitizeUrl } from '../security';

describe('security utils', () => {
  describe('isSafeUrl', () => {
    it('returns true for safe relative URLs', () => {
      expect(isSafeUrl('/albums')).toBe(true);
      expect(isSafeUrl('/en/login?redirect=/foo')).toBe(true);
    });

    it('returns false for protocol-relative (//) URLs', () => {
      expect(isSafeUrl('//evil.com')).toBe(false);
    });

    it('returns true for valid http/https/blob URLs', () => {
      expect(isSafeUrl('https://example.com/song.mp3')).toBe(true);
      expect(isSafeUrl('http://localhost:4000/media')).toBe(true);
      expect(isSafeUrl('blob:http://localhost:3000/123')).toBe(true);
    });

    it('returns false for javascript: malicious schemas', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('JAVASCRIPT:alert(1)')).toBe(false);
    });

    it('returns false for null/undefined/empty input', () => {
      expect(isSafeUrl(null)).toBe(false);
      expect(isSafeUrl(undefined)).toBe(false);
      expect(isSafeUrl('')).toBe(false);
    });
  });

  describe('sanitizeUrl', () => {
    it('returns clean url if safe', () => {
      expect(sanitizeUrl('https://safe.com')).toBe('https://safe.com');
      expect(sanitizeUrl('/music/1')).toBe('/music/1');
    });

    it('returns fallback if unsafe', () => {
      expect(sanitizeUrl('javascript:evil()')).toBe('about:blank');
      expect(sanitizeUrl('javascript:evil()', '/fallback')).toBe('/fallback');
      expect(sanitizeUrl(null, '/fallback')).toBe('/fallback');
    });
  });
});

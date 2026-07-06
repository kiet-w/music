import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

const VALID_KEY =
  '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff';

function createService(key?: string): EncryptionService {
  const configService = {
    get: jest.fn().mockReturnValue(key),
  } as unknown as ConfigService;
  return new EncryptionService(configService);
}

describe('EncryptionService', () => {
  describe('constructor', () => {
    it('throws when the key is missing', () => {
      expect(() => createService(undefined)).toThrow(/ENCRYPTION_KEY/);
    });

    it('throws when the key is not a 64-char hex string', () => {
      expect(() => createService('too-short')).toThrow(/ENCRYPTION_KEY/);
    });

    it('accepts a valid 64-char hex key', () => {
      expect(() => createService(VALID_KEY)).not.toThrow();
    });
  });

  describe('encrypt/decrypt', () => {
    let service: EncryptionService;

    beforeEach(() => {
      service = createService(VALID_KEY);
    });

    it('round-trips plaintext back to the original value', () => {
      const plaintext = 'super-secret-refresh-token';
      const encrypted = service.encrypt(plaintext);

      expect(encrypted).not.toBe(plaintext);
      expect(service.decrypt(encrypted)).toBe(plaintext);
    });

    it('produces the iv:tag:data format', () => {
      const encrypted = service.encrypt('hello');
      expect(encrypted.split(':')).toHaveLength(3);
    });

    it('produces different ciphertexts for the same plaintext (random iv)', () => {
      const a = service.encrypt('same');
      const b = service.encrypt('same');
      expect(a).not.toBe(b);
      expect(service.decrypt(a)).toBe(service.decrypt(b));
    });

    it.each(['', null, undefined])(
      'returns falsy input %p unchanged when encrypting',
      (value) => {
        expect(service.encrypt(value)).toBe(value);
      },
    );

    it('returns non-encrypted (legacy) values unchanged when decrypting', () => {
      expect(service.decrypt('plain-legacy-value')).toBe('plain-legacy-value');
    });

    it('returns the original ciphertext when the auth tag is tampered with', () => {
      const encrypted = service.encrypt('tamper-me');
      const [iv, , data] = encrypted.split(':');
      const tampered = `${iv}:${'0'.repeat(32)}:${data}`;

      expect(service.decrypt(tampered)).toBe(tampered);
    });

    it('cannot decrypt data encrypted with a different key', () => {
      const other = createService(
        'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
      );
      const encrypted = service.encrypt('cross-key');

      expect(other.decrypt(encrypted)).toBe(encrypted);
    });
  });
});

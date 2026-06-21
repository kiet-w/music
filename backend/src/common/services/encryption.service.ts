import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly key: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 12;
  private readonly tagLength = 16;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('ENCRYPTION_KEY');
    const hexRegex = /^[0-9a-fA-F]{64}$/;
    
    if (!keyHex || !hexRegex.test(keyHex)) {
      const logger = new Logger('EncryptionService');
      logger.error('FATAL ERROR: ENCRYPTION_KEY must be a 64-character hex string.');
      throw new Error('ENCRYPTION_KEY is missing or invalid. It must be a 64-character hex string.');
    }
    
    this.key = Buffer.from(keyHex, 'hex');
  }

  encrypt(text: string): string {
    if (!text) return text;
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;
    
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      // Return as-is if it's not encrypted (e.g. legacy data)
      return encryptedText;
    }

    try {
      const [ivHex, authTagHex, encryptedDataHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      // If decryption fails, return the original text as fallback
      return encryptedText;
    }
  }
}

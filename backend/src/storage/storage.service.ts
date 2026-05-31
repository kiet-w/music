/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { PinoLogger, InjectPinoLogger } from 'nestjs-pino';
import { IStorageProvider } from '../common/interfaces/storage-provider.interface';

@Injectable()
export class StorageService implements IStorageProvider {
  private supabase: SupabaseClient;

  constructor(
    @InjectPinoLogger(StorageService.name)
    private readonly logger: PinoLogger,
  ) {
    const rawUrl = process.env.SUPABASE_URL;
    const rawKey = process.env.SUPABASE_KEY;

    // Helper to validate URL
    const isValidUrl = (url: string | undefined): boolean => {
      if (!url) return false;
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };

    const isConfigured = isValidUrl(rawUrl) && !!rawKey;

    if (!isConfigured) {
      this.logger.error(
        { rawUrl, keyPresent: !!rawKey },
        'Supabase is not correctly configured',
      );
    }

    this.supabase = createClient(
      isConfigured ? rawUrl! : 'https://placeholder.supabase.co',
      isConfigured ? rawKey! : 'placeholder-key',
    );
  }

  async upload(
    filePath: string,
    bucketName: string,
    destinationPath: string,
  ): Promise<string> {
    try {
      this.logger.info(
        { filePath, bucketName, destinationPath },
        'Uploading file',
      );

      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found at path: ${filePath}`);
      }

      const fileBuffer = fs.readFileSync(filePath);
      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(destinationPath, fileBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        });

      if (error) {
        this.logger.error({ error: error.message }, 'Supabase upload error');
        throw new InternalServerErrorException(
          `Supabase upload failed: ${error.message}`,
        );
      }

      this.logger.info({ path: data.path }, 'File uploaded successfully');
      return data.path;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Upload failed');
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(error.message);
    }
  }

  async uploadBuffer(
    buffer: Buffer,
    bucketName: string,
    destinationPath: string,
    contentType: string = 'audio/mpeg',
  ): Promise<string> {
    try {
      this.logger.info(
        { bucketName, destinationPath, contentType },
        'Uploading buffer',
      );

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(destinationPath, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        this.logger.error({ error: error.message }, 'Supabase upload error');
        throw new InternalServerErrorException(
          `Supabase upload failed: ${error.message}`,
        );
      }

      this.logger.info({ path: data.path }, 'Buffer uploaded successfully');
      return data.path;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Buffer upload failed');
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(error.message);
    }
  }

  async uploadStream(
    stream: any,
    bucketName: string,
    destinationPath: string,
    contentType: string = 'audio/mpeg',
  ): Promise<string> {
    try {
      this.logger.info(
        { bucketName, destinationPath, contentType },
        'Uploading stream',
      );

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(destinationPath, stream, {
          contentType,
          upsert: true,
        });

      if (error) {
        this.logger.error({ error: error.message }, 'Supabase upload error');
        throw new InternalServerErrorException(
          `Supabase upload failed: ${error.message}`,
        );
      }

      this.logger.info({ path: data.path }, 'Stream uploaded successfully');
      return data.path;
    } catch (error) {
      this.logger.error({ error: error.message }, 'Stream upload failed');
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(error.message);
    }
  }

  async getPublicUrl(bucketName: string, path: string): Promise<string> {
    const { data } = this.supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  }

  async delete(bucketName: string, path: string): Promise<void> {
    try {
      this.logger.info({ bucketName, path }, 'Deleting file');
      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        this.logger.error({ error: error.message }, 'Supabase delete error');
        throw new InternalServerErrorException(
          `Supabase delete failed: ${error.message}`,
        );
      }

      this.logger.info({ path }, 'File deleted successfully');
    } catch (error) {
      this.logger.error({ error: error.message }, 'Delete failed');
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(error.message);
    }
  }
}


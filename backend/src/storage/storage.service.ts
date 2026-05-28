/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/require-await */
import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { IStorageProvider } from '../common/interfaces/storage-provider.interface';

@Injectable()
export class StorageService implements IStorageProvider {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
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
        `Supabase is not correctly configured. URL: ${rawUrl}, Key present: ${!!rawKey}`,
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
      this.logger.log(
        `Uploading file from ${filePath} to ${bucketName}/${destinationPath}`,
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
        this.logger.error(`Supabase upload error: ${error.message}`);
        throw new InternalServerErrorException(
          `Supabase upload failed: ${error.message}`,
        );
      }

      this.logger.log(`File uploaded successfully: ${data.path}`);
      return data.path;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
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
      this.logger.log(
        `Uploading buffer to ${bucketName}/${destinationPath} with content-type ${contentType}`,
      );

      const { data, error } = await this.supabase.storage
        .from(bucketName)
        .upload(destinationPath, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        this.logger.error(`Supabase upload error: ${error.message}`);
        throw new InternalServerErrorException(
          `Supabase upload failed: ${error.message}`,
        );
      }

      this.logger.log(`Buffer uploaded successfully: ${data.path}`);
      return data.path;
    } catch (error) {
      this.logger.error(`Buffer upload failed: ${error.message}`);
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
      this.logger.log(`Deleting file from ${bucketName}/${path}`);
      const { error } = await this.supabase.storage
        .from(bucketName)
        .remove([path]);

      if (error) {
        this.logger.error(`Supabase delete error: ${error.message}`);
        throw new InternalServerErrorException(
          `Supabase delete failed: ${error.message}`,
        );
      }

      this.logger.log(`File deleted successfully: ${path}`);
    } catch (error) {
      this.logger.error(`Delete failed: ${error.message}`);
      throw error instanceof InternalServerErrorException
        ? error
        : new InternalServerErrorException(error.message);
    }
  }
}

# Task 1: Infrastructure & Core Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish core infrastructure interfaces, global validation, and refactor existing services to use these interfaces with improved error handling and TDD.

**Architecture:** Use Dependency Inversion Principle by defining interfaces for external services (Storage, Downloader). Implement these in existing services. Configure global validation in NestJS.

**Tech Stack:** NestJS, TypeScript, class-validator, class-transformer, Supabase, yt-dlp.

---

### Task 1.1: Global Validation Pipe

**Files:**
- Modify: `backend/src/main.ts`

- [ ] **Step 1: Implement ValidationPipe in main.ts**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
```

- [ ] **Step 2: Verify compilation**
Run: `npm run build` in `backend/`
Expected: SUCCESS

---

### Task 1.2: Infrastructure Interfaces

**Files:**
- Create: `backend/src/common/interfaces/storage-provider.interface.ts`
- Create: `backend/src/common/interfaces/downloader-provider.interface.ts`

- [ ] **Step 1: Create IStorageProvider interface**

```typescript
export interface IStorageProvider {
  upload(
    filePath: string,
    bucketName: string,
    destinationPath: string,
  ): Promise<string>;
  getPublicUrl(bucketName: string, path: string): Promise<string>;
}
```

- [ ] **Step 2: Create IDownloaderProvider interface**

```typescript
export interface IDownloaderProvider {
  download(url: string, outputPath: string): Promise<void>;
}
```

---

### Task 1.3: Refactor StorageService

**Files:**
- Modify: `backend/src/storage/storage.service.ts`
- Test: `backend/src/storage/storage.service.spec.ts`

- [ ] **Step 1: Write the failing test for StorageService**
(Check if `storage.service.spec.ts` exists, if not create it)

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  
  // Add more specific tests for upload and getPublicUrl if possible with mocks
});
```

- [ ] **Step 2: Run test to verify it fails (or passes initial check)**
Run: `npm test backend/src/storage/storage.service.spec.ts`

- [ ] **Step 3: Refactor StorageService to implement IStorageProvider**

```typescript
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { IStorageProvider } from '../common/interfaces/storage-provider.interface';

@Injectable()
export class StorageService implements IStorageProvider {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;

    if (!url || !key) {
      this.logger.error('Supabase URL or Key missing from environment variables');
    }

    this.supabase = createClient(
      url || 'https://placeholder.supabase.co',
      key || 'placeholder-key'
    );
  }

  async upload(filePath: string, bucketName: string, destinationPath: string): Promise<string> {
    try {
      this.logger.log(`Uploading file from ${filePath} to ${bucketName}/${destinationPath}`);
      
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
        throw new InternalServerErrorException(`Supabase upload failed: ${error.message}`);
      }

      this.logger.log(`File uploaded successfully: ${data.path}`);
      return data.path;
    } catch (error) {
      this.logger.error(`Upload failed: ${error.message}`);
      throw error instanceof InternalServerErrorException ? error : new InternalServerErrorException(error.message);
    }
  }

  async getPublicUrl(bucketName: string, path: string): Promise<string> {
    const { data } = this.supabase.storage.from(bucketName).getPublicUrl(path);
    return data.publicUrl;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test backend/src/storage/storage.service.spec.ts`

---

### Task 1.4: Refactor DownloaderService

**Files:**
- Modify: `backend/src/downloader/downloader.service.ts`
- Test: `backend/src/downloader/downloader.service.spec.ts`

- [ ] **Step 1: Write/Update the failing test for DownloaderService**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { DownloaderService } from './downloader.service';

describe('DownloaderService', () => {
  let service: DownloaderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DownloaderService],
    }).compile();

    service = module.get<DownloaderService>(DownloaderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails/passes**
Run: `npm test backend/src/downloader/downloader.service.spec.ts`

- [ ] **Step 3: Refactor DownloaderService to implement IDownloaderProvider**

```typescript
import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { IDownloaderProvider } from '../common/interfaces/downloader-provider.interface';

const execAsync = promisify(exec);

@Injectable()
export class DownloaderService implements IDownloaderProvider {
  private readonly logger = new Logger(DownloaderService.name);

  async download(url: string, outputPath: string): Promise<void> {
    try {
      this.logger.log(`Starting download from ${url} to ${outputPath}`);
      // Basic yt-dlp command to download audio as mp3
      // -x: extract audio, --audio-format: mp3, -o: output path
      await execAsync(`yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`);
      this.logger.log(`Download completed: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Download failed for URL ${url}: ${error.message}`);
      throw new InternalServerErrorException(`yt-dlp download failed: ${error.message}`);
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**
Run: `npm test backend/src/downloader/downloader.service.spec.ts`

---

### Task 1.5: Final Verification & Commit

- [ ] **Step 1: Final build check**
Run: `npm run build` in `backend/`

- [ ] **Step 2: Commit changes**
Run: `git add . && git commit -m "refactor: setup core infrastructure and interfaces"`

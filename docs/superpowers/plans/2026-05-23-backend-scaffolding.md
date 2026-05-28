# Backend Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a NestJS backend with yt-dlp conversion and Supabase storage/Prisma integration.

**Architecture:** NestJS API with modular services for conversion, storage, and database management.

**Tech Stack:** NestJS, Prisma, @supabase/supabase-js, yt-dlp.

---

### Task 1: NestJS Project Scaffolding

**Files:**
- Create: `backend/*`

- [ ] **Step 1: Initialize NestJS project**
Run: `npx @nestjs/cli new backend --package-manager npm --skip-git` (Use defaults)

- [ ] **Step 2: Install dependencies**
Run: `cd backend && npm install @prisma/client @supabase/supabase-js dotenv`
Run: `npm install -D prisma`

- [ ] **Step 3: Verify initial build**
Run: `cd backend && npm run build`
Expected: Successful build.

- [ ] **Step 4: Commit**
```bash
git add backend
git commit -m "chore: scaffold nestjs backend"
```

### Task 2: Prisma Setup (Supabase)

**Files:**
- Create: `backend/prisma/schema.prisma`
- Modify: `backend/.env`

- [ ] **Step 1: Initialize Prisma**
Run: `cd backend && npx prisma init`

- [ ] **Step 2: Define Schema**
```prisma
// backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Song {
  id        String   @id @default(uuid())
  title     String
  artist    String?
  duration  Int?
  storagePath String
  createdAt DateTime @default(node.now())
}
```

- [ ] **Step 3: Configure DATABASE_URL**
Modify `backend/.env` (Placeholder for user, but use Port 6543 mandate)
```text
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres?pgbouncer=true"
```

- [ ] **Step 4: Commit**
```bash
git add backend/prisma backend/.env
git commit -m "feat: setup prisma with supabase schema"
```

### Task 3: Downloader Service (yt-dlp)

**Files:**
- Create: `backend/src/downloader/downloader.service.ts`
- Create: `backend/src/downloader/downloader.module.ts`

- [ ] **Step 1: Implement Service**
```typescript
import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DownloaderService {
  async download(url: string, outputPath: string): Promise<void> {
    // Basic yt-dlp command to download audio as mp3
    await execAsync(`yt-dlp -x --audio-format mp3 -o "${outputPath}" "${url}"`);
  }
}
```

- [ ] **Step 2: Create failing test**
Create `backend/src/downloader/downloader.service.spec.ts` to mock exec and verify call.

- [ ] **Step 3: Run test**
Run: `cd backend && npm run test`

- [ ] **Step 4: Commit**
```bash
git add backend/src/downloader
git commit -m "feat: add downloader service using yt-dlp"
```

### Task 4: Storage Service (Supabase)

**Files:**
- Create: `backend/src/storage/storage.service.ts`

- [ ] **Step 1: Implement Storage Service**
```typescript
import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
  private supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  async upload(filePath: string, bucketPath: string) {
    // Read file and upload to Supabase bucket 'songs'
  }
}
```

- [ ] **Step 2: Commit**
```bash
git add backend/src/storage
git commit -m "feat: add supabase storage service"
```

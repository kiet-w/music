# Music App Full-Stack Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive music application with YouTube to MP3 conversion, Google Drive import, and a mobile-friendly player.

**Architecture:** A Fastify backend handles heavy lifting (yt-dlp conversion, job queue via BullMQ) and data persistence (PostgreSQL/Prisma). A Next.js 14 frontend provides a rich UI for album management and playback, wrapped with Capacitor for mobile deployment.

**Tech Stack:** 
- Frontend: Next.js 14 (App Router), Tailwind CSS, Howler.js, Capacitor.
- Backend: Fastify, BullMQ, Redis, Prisma, PostgreSQL.
- Utilities: yt-dlp, FFmpeg, Google Drive API.

---

### Phase 1: Backend Foundation

#### Task 1: Initialize Backend Project
**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/src/server.ts`

- [ ] **Step 1: Create package.json with dependencies**
```json
{
  "name": "music-backend",
  "version": "1.0.0",
  "main": "dist/server.js",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "fastify": "^4.26.2",
    "@fastify/cors": "^9.0.1",
    "@fastify/static": "^7.0.1",
    "bullmq": "^5.4.1",
    "ioredis": "^5.3.2",
    "@prisma/client": "^5.11.0",
    "zod": "^3.22.4",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "tsx": "^4.7.1",
    "typescript": "^5.4.2",
    "@types/node": "^20.11.28",
    "prisma": "^5.11.0"
  }
}
```

- [ ] **Step 2: Initialize basic Fastify server**
```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';

const fastify = Fastify({ logger: true });

fastify.register(cors);

fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
```

- [ ] **Step 3: Commit foundation**
```bash
git add backend/
git commit -m "chore: initialize fastify backend foundation"
```

#### Task 2: Database Schema (Prisma)
**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/.env`

- [ ] **Step 1: Define schema**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Album {
  id          String   @id @default(cuid())
  title       String
  artist      String?
  coverUrl    String?
  createdAt   DateTime @default(now())
  tracks      Track[]
}

model Track {
  id          String   @id @default(cuid())
  title       String
  artist      String?
  url         String
  duration    Int?     // seconds
  albumId     String
  album       Album    @relation(fields: [albumId], references: [id])
  sourceType  String   // 'youtube', 'drive', 'local'
  sourceId    String?
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 2: Run migration**
Run: `npx prisma migrate dev --name init`

- [ ] **Step 3: Commit schema**
```bash
git add backend/prisma/
git commit -m "feat: add database schema with prisma"
```

---

### Phase 2: YouTube Conversion Engine

#### Task 3: BullMQ & YouTube Worker
**Files:**
- Create: `backend/src/queues/conversion.queue.ts`
- Create: `backend/src/workers/conversion.worker.ts`

- [ ] **Step 1: Setup Queue and Worker**
```typescript
// backend/src/queues/conversion.queue.ts
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
export const conversionQueue = new Queue('conversion', { connection });

// backend/src/workers/conversion.worker.ts
import { Worker } from 'bullmq';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const worker = new Worker('conversion', async job => {
  const { url, trackId } = job.data;
  const outputPath = path.join(__dirname, '../../storage', `${trackId}.mp3`);
  
  // Update job progress
  await job.updateProgress(10);
  
  // Use yt-dlp to download and convert
  const command = `yt-dlp -x --audio-format mp3 -o "${outputPath}" ${url}`;
  await execAsync(command);
  
  await job.updateProgress(90);
  
  // Update DB
  await prisma.track.update({
    where: { id: trackId },
    data: { url: `/storage/${trackId}.mp3` }
  });
  
  return { success: true, path: outputPath };
}, { connection });
```

- [ ] **Step 2: Commit conversion worker**
```bash
git add backend/src/queues/ backend/src/workers/
git commit -m "feat: implement youtube conversion worker with bullmq"
```

---

### Phase 3: Frontend Foundation (Next.js 14 Migration)

#### Task 4: Migrate Vite to Next.js 14
**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/next.config.js`
- Create: `frontend/app/layout.tsx`
- Create: `frontend/app/page.tsx`

- [ ] **Step 1: Update dependencies for Next.js**
```json
{
  "dependencies": {
    "next": "14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "howler": "^2.2.4",
    "lucide-react": "^0.344.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1"
  }
}
```

- [ ] **Step 2: Create root layout and landing page**
```tsx
// frontend/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <main className="min-h-screen bg-black text-white pb-24">
          {children}
        </main>
        {/* Player bar will go here */}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit migration**
```bash
git add frontend/
git commit -m "feat: migrate frontend to next.js 14 app router"
```

#### Task 5: Core Player Bar (Howler.js)
**Files:**
- Create: `frontend/src/components/Player/PlayerBar.tsx`
- Create: `frontend/src/hooks/usePlayer.ts`

- [ ] **Step 1: Implement global player state with Zustand or Context**
- [ ] **Step 2: Build PlayerBar component with playback controls**
- [ ] **Step 3: Commit player component**

---

### Phase 4: Main Pages Implementation

#### Task 6: Home Page (Album Grid)
- [ ] **Step 1: Fetch and display albums**
```tsx
// app/page.tsx
export default async function HomePage() {
  const albums = await getAlbums(); // Server action or fetch
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {albums.map(album => (
        <AlbumCard key={album.id} album={album} />
      ))}
    </div>
  );
}
```

#### Task 7: YouTube Import & Polling
- [ ] **Step 1: Create YouTube import form**
- [ ] **Step 2: Implement polling for job status**
```tsx
const pollStatus = async (jobId: string) => {
  const res = await fetch(`/api/jobs/${jobId}`);
  const data = await res.json();
  if (data.status === 'completed') {
    // Refresh or redirect
  } else {
    setTimeout(() => pollStatus(jobId), 1000);
  }
};
```

---

### Phase 5: Google Drive & Capacitor

#### Task 8: Google Drive Import
- [ ] **Step 1: Setup OAuth2 on Backend**
- [ ] **Step 2: Implement file picker and backend streamer**

#### Task 9: Capacitor Setup
- [ ] **Step 1: Initialize Capacitor in frontend**
```bash
npx cap init music-app com.example.musicapp --web-dir out
npm install @capacitor/android
npx cap add android
```
- [ ] **Step 2: Build and sync**
```bash
npm run build
npx cap sync
```

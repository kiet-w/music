# Music Backend Implementation Plan (NestJS + Supabase)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a robust NestJS backend integrated with Supabase for data, storage, and auth.

**Architecture:** NestJS microservices-ready structure, Prisma for DB access (PostgreSQL via Supabase), BullMQ for background conversion tasks, and Supabase Storage for MP3 files.

**Tech Stack:** NestJS, Prisma, Supabase, BullMQ, Redis, yt-dlp.

---

### Task 1: NestJS & Prisma Initialization
**Files:**
- Create: `backend/src/main.ts`
- Create: `backend/prisma/schema.prisma`
- Create: `backend/.env`

- [ ] **Step 1: Scaffold NestJS project with Prisma**
- [ ] **Step 2: Configure Supabase Connection (Port 6543 mandate)**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL") // Must use port 6543 for transaction pooling
}
```
- [ ] **Step 3: Define Schema (Album, Track) - similar to previous spec**
- [ ] **Step 4: Commit foundation**

### Task 2: Supabase Storage & Conversion Service
- [ ] **Step 1: Implement Supabase Client Service**
- [ ] **Step 2: Create YouTube Conversion Service (using BullMQ)**
- [ ] **Step 3: Implement immediate cleanup of temp files after Supabase upload**
- [ ] **Step 4: Commit storage & conversion logic**

### Task 3: API Controllers & Modules
- [ ] **Step 1: Albums Module (CRUD)**
- [ ] **Step 2: Tracks Module (YouTube trigger + polling status)**
- [ ] **Step 3: Google Drive Integration Module**
- [ ] **Step 4: Commit API**

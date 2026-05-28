# Music Player & Downloader (GEMINI.md)

This file provides instructional context and mandates for AI agents working within the `music` directory.

## Core Guidelines
# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.


## Project Overview
A comprehensive music application featuring YouTube downloading/conversion and a cross-platform mobile player.
- **Goal:** Personal/Offline music usage.
- **Core Workflow:** User inputs YouTube URL -> NestJS Backend converts via `yt-dlp` -> MP3 uploaded to Supabase Storage -> Frontend streams via Howler.js.

## Tech Stack
### Frontend
- **React + Vite:** Pure client-side application, optimized for static builds and Capacitor integration.
- **Howler.js:** Advanced audio management for mobile WebViews with HTML5 fallback.
- **Capacitor:** Cross-platform wrapper to deliver the web app as a native mobile application.

### Backend (NestJS)
- **Conversion Pipeline:** Utilizes `yt-dlp` (Python CLI) for robust YouTube downloading and MP3 conversion.
- **Media Hosting:** Files are uploaded to **Supabase Storage** for direct streaming to the client.
- **Database ORM:** **Prisma** for data management.

### Infrastructure & Database
- **Supabase:** Provides both the relational database and object storage.
- **Connection Mandate:** For Prisma, always use **Port 6543** (Transaction pooler) instead of 5432 to prevent "too many connections" errors on the Supabase free tier.

## Directory Structure (Planned)
- `frontend/`: React + Vite project.
- `backend/`: NestJS project (includes conversion services).
- `docs/`: Documentation and planning assets.

## Operational Mandates
- **Prisma Connection:** String must target port **6543** for transaction pooling.
- **Conversion Tooling:** Always prefer `yt-dlp` over npm-based YouTube libraries for better API stability.
- **Storage Strategy:** Backend acts as a pass-through/converter; permanent storage must be handled by Supabase Storage, not the local server filesystem.
- **Legal & Ethics:** This project is for **personal/offline use only**. Do not deploy publicly, monetize, or violate YouTube's Terms of Service in a commercial capacity.
- **Performance:** Ensure backend cleans up temporary MP3 files immediately after a successful Supabase upload.

## Building and Running
- **Backend:** `npm run start:dev` (TODO: Verify after scaffolding)
- **Frontend:** `npm run dev` (TODO: Verify after scaffolding)
- **Database:** `npx prisma migrate dev`

---
*Updated by Gemini CLI on May 23, 2026, based on the provided architectural plan.*

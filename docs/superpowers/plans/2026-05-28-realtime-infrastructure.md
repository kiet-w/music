# Real-time Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the Supabase client in the frontend to enable real-time features.

**Architecture:** Initialize a singleton Supabase client in the frontend and export it for use across the application. Use environment variables for configuration.

**Tech Stack:** Next.js, @supabase/supabase-js

---

### Task 1: Supabase Client Setup

**Files:**
- Create: `frontend/src/lib/supabase.ts`
- Modify: `frontend/package.json`

- [ ] **Step 1: Install @supabase/supabase-js**

Run: `cd frontend && npm install @supabase/supabase-js`
Expected: Package added to `package.json` and `node_modules`.

- [ ] **Step 2: Create Supabase client library**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

File: `frontend/src/lib/supabase.ts`

- [ ] **Step 3: Verify package installation**

Run: `grep "@supabase/supabase-js" frontend/package.json`
Expected: Line containing "@supabase/supabase-js" and version.

- [ ] **Step 4: Verify file existence**

Run: `ls -l frontend/src/lib/supabase.ts`
Expected: File details shown.

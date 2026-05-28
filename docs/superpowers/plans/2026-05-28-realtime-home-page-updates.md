# Real-time Home Page Updates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement real-time updates for the home page so it automatically reflects new or updated albums.

**Architecture:** Use `useSupabaseRealtime` hook in the `HomePage` component to subscribe to the `Album` table and re-fetch data on changes.

**Tech Stack:** React, Supabase Realtime, Next.js.

---

### Task 1: Implement Real-time Updates in HomePage

**Files:**
- Modify: `frontend/src/app/[locale]/page.tsx`

- [ ] **Step 1: Import necessary hooks**

Add `useCallback` to the React imports and import `useSupabaseRealtime` from `@/hooks/useSupabaseRealtime`.

```tsx
import React, { useEffect, useState, useCallback } from 'react';
// ...
import { useSupabaseRealtime } from '@/hooks/useSupabaseRealtime';
```

- [ ] **Step 2: Refactor data loading into a stable function**

Wrap the album fetching logic in `useCallback` so it can be used by both `useEffect` and `useSupabaseRealtime` without causing unnecessary re-subscriptions.

```tsx
  const loadAlbums = useCallback(() => {
    fetchAlbums()
      .then(setAlbums)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadAlbums();
  }, [loadAlbums]);
```

- [ ] **Step 3: Add real-time subscription**

Call `useSupabaseRealtime` to listen for any changes on the `Album` table.

```tsx
  useSupabaseRealtime('Album', loadAlbums);
```

- [ ] **Step 4: Verify the changes**

Since I cannot easily trigger a database event, I will verify the code compiles and the `useSupabaseRealtime` hook is correctly integrated.

Run: `cd frontend && npm run build` (or just check if it lints)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/[locale]/page.tsx
git commit -m "feat: add real-time updates to home page"
```

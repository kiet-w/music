# Supabase Realtime Hook Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a reusable React hook for subscribing to Supabase Realtime changes.

**Architecture:** A custom React hook `useSupabaseRealtime` that utilizes the Supabase client to subscribe to PostgreSQL changes on a specific table and execute a callback on events.

**Tech Stack:** React, @supabase/supabase-js

---

### Task 1: Implement useSupabaseRealtime Hook

**Files:**
- Create: `frontend/src/hooks/useSupabaseRealtime.ts`

- [ ] **Step 1: Write the hook implementation**

```typescript
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

/**
 * Hook to subscribe to real-time changes in a Supabase table.
 * 
 * @param table - The name of the table to subscribe to.
 * @param callback - Function to handle the change payload.
 */
export function useSupabaseRealtime<T extends { [key: string]: any }>(
  table: string,
  callback: (payload: RealtimePostgresChangesPayload<T>) => void
) {
  useEffect(() => {
    if (!table) return;

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
        },
        (payload) => {
          callback(payload as RealtimePostgresChangesPayload<T>);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, callback]);
}
```

- [ ] **Step 2: Verify types and imports**
Ensure `@/lib/supabase` is correctly resolved and `@supabase/supabase-js` types are used.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useSupabaseRealtime.ts
git commit -m "feat: implement useSupabaseRealtime hook"
```

### Task 2: Create Placeholder Environment File

**Files:**
- Create: `frontend/.env.local`

- [ ] **Step 1: Create .env.local with placeholders**

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

- [ ] **Step 2: Commit**

```bash
git add frontend/.env.local
git commit -m "chore: add supabase env placeholders"
```

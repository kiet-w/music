# Frontend Lazy Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement lazy loading for components and images to optimize page weight and load speed.

**Architecture:** Use `next/dynamic` for code-splitting components and `loading="lazy"` for native image lazy loading.

**Tech Stack:** Next.js, React, TypeScript.

---

### Task 1: Lazy Load AddToPlaylistDialog in Library

**Files:**
- Modify: `frontend/src/components/molecules/Library/Library.tsx`

- [ ] **Step 1: Replace static import with dynamic import**

```tsx
import dynamic from 'next/dynamic';
// Remove: import { AddToPlaylistDialog } from '../AddToPlaylist/AddToPlaylistDialog';

const AddToPlaylistDialog = dynamic(() => import('../AddToPlaylist/AddToPlaylistDialog').then(mod => mod.AddToPlaylistDialog), {
  ssr: false,
});
```

- [ ] **Step 2: Verify dialog still works**

Check if clicking the "Plus" icon still opens the dialog.

---

### Task 2: Lazy Load PlaylistGrid in HomePage

**Files:**
- Modify: `frontend/src/app/[locale]/page.tsx`

- [x] **Step 1: Replace static import with dynamic import**

```tsx
import dynamic from 'next/dynamic';
// Remove: import { PlaylistGrid } from '@/components/molecules/Playlist/PlaylistGrid';

const PlaylistGrid = dynamic(() => import('@/components/molecules/Playlist/PlaylistGrid').then(mod => mod.PlaylistGrid), {
  loading: () => <div className="h-48 bg-muted animate-pulse rounded-xl w-full" />,
  ssr: false,
});
```

- [x] **Step 2: Verify grid rendering**

Check if the placeholder appears and then the grid loads.

---

### Task 3: Apply Native Lazy Loading to Images

**Files:**
- Modify: `frontend/src/app/[locale]/page.tsx`
- Modify: `frontend/src/components/molecules/Playlist/PlaylistCard.tsx`
- Modify: `frontend/src/components/molecules/PlayerBar.tsx`

- [ ] **Step 1: Add loading="lazy" to all img tags**

Search and replace `className="w-full h-full object-cover"` with `loading="lazy" className="w-full h-full object-cover"`.

- [ ] **Step 2: Verify images load correctly**

Scroll down the page to ensure images load as they enter the viewport.

- [ ] **Step 3: Commit changes**

```bash
git add frontend/src/components/molecules/Library/Library.tsx \
        frontend/src/app/[locale]/page.tsx \
        frontend/src/components/molecules/Playlist/PlaylistCard.tsx \
        frontend/src/components/molecules/PlayerBar.tsx
git commit -m "perf: implement lazy loading for components and images"
```

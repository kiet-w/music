# Frontend Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Optimize frontend performance by applying `useMemo` for memoization and `reduce` for data transformation in three key components.

**Architecture:** Use `useMemo` to wrap expensive list operations and `reduce` to compute aggregate statistics within those memoized blocks. This reduces re-render overhead and centralizes data processing.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide Icons.

---

### Task 1: Optimize Library Component

**Files:**
- Modify: `frontend/src/components/molecules/Library/Library.tsx`

- [ ] **Step 1: Implement useMemo and reduce in Library**

```tsx
// Inside Library component
const { memoizedTracks, totalDuration } = React.useMemo(() => {
  const duration = tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
  return { memoizedTracks: tracks, totalDuration: duration };
}, [tracks]);

// Update formatDuration and usage
const stats = React.useMemo(() => ({
  count: tracks.length,
  formattedTotal: formatDuration(totalDuration)
}), [tracks.length, totalDuration]);
```

- [ ] **Step 2: Update JSX to show stats**

Add a small stats bar above the tracks list showing "Total: X songs • Y total time".

- [ ] **Step 3: Verify rendering and statistics**

Check if the track list still renders and statistics are accurate.

---

### Task 2: Optimize Home Page

**Files:**
- Modify: `frontend/src/app/[locale]/page.tsx`

- [ ] **Step 1: Implement useMemo and reduce in HomePage**

```tsx
// Inside HomePage component
const { processedAlbums, totalSongs } = React.useMemo(() => {
  const topAlbums = albums.slice(0, 6);
  const total = albums.reduce((acc, album) => acc + (album._count?.songs || 0), 0);
  return { processedAlbums: topAlbums, totalSongs: total };
}, [albums]);
```

- [ ] **Step 2: Update JSX to show total song count**

Add "Collection: X songs" near the "Recently Played" header.

- [ ] **Step 3: Verify album grid and song count**

Ensure the grid still shows the same albums and the total count is correct.

---

### Task 3: Optimize Playlist Grid

**Files:**
- Modify: `frontend/src/components/molecules/Playlist/PlaylistGrid.tsx`

- [ ] **Step 1: Implement useMemo and reduce in PlaylistGrid**

```tsx
// Inside PlaylistGrid component
const { bentoPlaylists, stats } = React.useMemo(() => {
  const categorized = DEMO_PLAYLISTS.reduce((acc, p) => {
    if (p.songCount > 50) acc.large++;
    else acc.small++;
    return acc;
  }, { large: 0, small: 0 });

  return { bentoPlaylists: DEMO_PLAYLISTS, stats: categorized };
}, []);
```

- [ ] **Step 2: Verify Bento layout and animations**

Ensure the `motion.div` still applies correct grid classes and animations remain smooth.

- [ ] **Step 3: Commit all changes**

```bash
git add frontend/src/components/molecules/Library/Library.tsx \
        frontend/src/app/[locale]/page.tsx \
        frontend/src/components/molecules/Playlist/PlaylistGrid.tsx
git commit -m "perf: optimize list rendering and statistics using useMemo and reduce"
```

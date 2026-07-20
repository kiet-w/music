# Shadcn & Atoms Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Shadcn UI and build custom Atomic skeletons while maintaining the project's music-focused aesthetic.

**Architecture:** Initialize Shadcn UI, configure atomic folder structure, and build reusable skeleton atoms. Consolidate CSS to prioritize Tailwind variables.

**Tech Stack:** Next.js 14, Tailwind CSS, Shadcn UI, Lucide React.

---

### Task 1: Initialize Shadcn UI

**Files:**
- Modify: `components.json` (created)
- Modify: `tailwind.config.js`
- Modify: `app/globals.css`

- [ ] **Step 1: Run Shadcn initialization**

Run: `rtk npx shadcn@latest init -d`
Expected: `components.json` created, `tailwind.config.js` updated.

- [ ] **Step 2: Update `components.json` for Atomic structure**

Ensure components are placed in `src/components/atoms/ui`.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "src/components",
    "utils": "src/lib/utils",
    "ui": "src/components/atoms/ui"
  }
}
```

- [ ] **Step 3: Merge Tailwind configuration**

Restore custom colors (`background`, `surface`, etc.) if overwritten, or map them to Shadcn variables.

- [ ] **Step 4: Commit**

```bash
git add components.json tailwind.config.js app/globals.css
git commit -m "chore: initialize shadcn ui with atomic structure"
```

### Task 2: Install Shadcn Components

**Files:**
- Create: `src/components/atoms/ui/button.tsx`
- Create: `src/components/atoms/ui/skeleton.tsx`
- Create: `src/components/atoms/ui/card.tsx`

- [ ] **Step 1: Add components via CLI**

Run: `rtk npx shadcn@latest add button skeleton card`

- [ ] **Step 2: Verify file locations**

Check that they are in `src/components/atoms/ui/`.

- [ ] **Step 3: Commit**

```bash
git add src/components/atoms/ui/
git commit -m "feat: add shadcn button, skeleton, and card atoms"
```

### Task 3: Build Custom Skeleton Atoms

**Files:**
- Create: `src/components/atoms/AlbumSkeleton.tsx`
- Create: `src/components/atoms/TrackSkeleton.tsx`

- [ ] **Step 1: Create AlbumSkeleton component**

```tsx
import { Skeleton } from "@/components/atoms/ui/skeleton"
import { Card, CardContent } from "@/components/atoms/ui/card"

export function AlbumSkeleton() {
  return (
    <Card className="overflow-hidden border-none bg-transparent">
      <CardContent className="p-0">
        <Skeleton className="aspect-square w-full rounded-md" />
        <div className="space-y-2 py-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create TrackSkeleton component**

```tsx
import { Skeleton } from "@/components/atoms/ui/skeleton"

export function TrackSkeleton() {
  return (
    <div className="flex items-center space-x-4 py-2">
      <Skeleton className="h-12 w-12 rounded-md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-4 w-12" />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/atoms/AlbumSkeleton.tsx src/components/atoms/TrackSkeleton.tsx
git commit -m "feat: add AlbumSkeleton and TrackSkeleton atoms"
```

### Task 4: Clean up CSS

**Files:**
- Modify: `app/globals.css`
- Delete: `src/index.css`
- Modify: `src/main.tsx` (remove index.css import)

- [ ] **Step 1: Consolidate CSS into `globals.css`**

Merge relevant reset styles from `index.css` into `globals.css` while keeping Shadcn variables. Ensure dark mode defaults to the music player's dark aesthetic (`#0F0F0F`).

- [ ] **Step 2: Update `src/main.tsx`**

Remove `import './index.css'`.

- [ ] **Step 3: Delete `src/index.css`**

Run: `rm src/index.css`

- [ ] **Step 4: Verify UI**

Run build or dev to check for errors.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css src/main.tsx
git rm src/index.css
git commit -m "chore: consolidate css and cleanup index.css"
```

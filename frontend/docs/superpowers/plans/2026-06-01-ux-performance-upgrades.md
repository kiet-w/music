# UX Guardrails and Performance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement UX guardrails, shimmering skeletons, tactile feedback, and safe-area compliance.

**Architecture:** Use `dvh` units for height, CSS keyframes for shimmering, `scale` transforms for feedback, and `env()` for safe areas.

**Tech Stack:** React, Tailwind CSS, Next.js.

---

### Task 1: Foundation - Tailwind Configuration
**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Add shimmer keyframes and animation**
Add the following to `theme.extend`:
```javascript
keyframes: {
  shimmer: {
    '100%': { transform: 'translateX(100%)' },
  },
},
animation: {
  shimmer: 'shimmer 2s infinite',
},
```

- [ ] **Step 2: Commit**
```bash
git add tailwind.config.js
git commit -m "style: add shimmer animation to tailwind config"
```

### Task 2: Layout & Height Standardization
**Files:**
- Modify: `src/components/auth/AuthGate.tsx`
- Modify: `src/components/layout/MainContainer.tsx`

- [ ] **Step 1: Update AuthGate height and animation**
Replace `min-h-dvh` with `min-h-[100dvh]` and add `will-change-transform` to loader.
- [ ] **Step 2: Update MainContainer height**
Replace `min-h-dvh` with `min-h-[100dvh]`.

- [ ] **Step 3: Commit**
```bash
git add src/components/auth/AuthGate.tsx src/components/layout/MainContainer.tsx
git commit -m "ux: standardize on min-h-[100dvh] and optimize loader performance"
```

### Task 3: Skeleton Upgrades
**Files:**
- Modify: `src/components/atoms/ui/skeleton.tsx`
- Modify: `src/components/atoms/AlbumSkeleton.tsx`
- Modify: `src/components/atoms/TrackSkeleton.tsx`

- [ ] **Step 1: Upgrade base Skeleton with shimmer**
Update `skeleton.tsx` to include a shimmering overlay.
```tsx
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("relative overflow-hidden rounded-md bg-muted/50", className)}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  )
}
```
- [ ] **Step 2: Enhance AlbumSkeleton and TrackSkeleton**
Match the actual layout more closely and use the new shimmering base.

- [ ] **Step 3: Commit**
```bash
git add src/components/atoms/ui/skeleton.tsx src/components/atoms/AlbumSkeleton.tsx src/components/atoms/TrackSkeleton.tsx
git commit -m "ux: upgrade skeletons with shimmering animations and better layouts"
```

### Task 4: Tactile Interaction Feedback
**Files:**
- Modify: `src/components/atoms/ui/button.tsx`
- Modify: `src/components/molecules/Playlist/PlaylistCard.tsx`
- Modify: `src/components/molecules/Navigation/BottomTabBar.tsx`
- Modify: `src/components/molecules/PlayerBar.tsx`
- Modify: `src/components/templates/AlbumsTemplate.tsx`

- [ ] **Step 1: Update Button tactile feedback**
Add `active:scale-[0.98]` to `buttonVariants`.
- [ ] **Step 2: Update Cards and Links tactile feedback**
Add `active:scale-[0.98]` and `transition-transform` to `PlaylistCard`, `BottomTabBar` tabs, `PlayerBar` buttons, and `AlbumsTemplate` links.

- [ ] **Step 3: Commit**
```bash
git add src/components/atoms/ui/button.tsx src/components/molecules/Playlist/PlaylistCard.tsx src/components/molecules/Navigation/BottomTabBar.tsx src/components/molecules/PlayerBar.tsx src/components/templates/AlbumsTemplate.tsx
git commit -m "ux: add tactile interaction feedback (scale-down on active)"
```

### Task 5: Safe-Area & Z-Index Audit
**Files:**
- Modify: `src/components/molecules/PlayerBar.tsx`

- [ ] **Step 1: Fix PlayerBar positioning**
Account for `env(safe-area-inset-bottom)` to prevent collision with tab bar.
```tsx
className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] ..."
```

- [ ] **Step 2: Commit**
```bash
git add src/components/molecules/PlayerBar.tsx
git commit -m "ux: ensure PlayerBar respects safe areas and z-index"
```

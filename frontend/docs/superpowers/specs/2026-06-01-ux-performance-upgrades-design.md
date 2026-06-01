# UX Guardrails, Performance, and Skeleton upgrades Design

## Goal
Improve the perceived quality, responsiveness, and mobile-native feel of the application through standardizing layout heights, enhancing loading states, adding tactile feedback, and ensuring safe-area compliance.

## Architecture & Approaches

### 1. Unified Full-Height Containers
- **Problem:** `100vh` on mobile often includes areas hidden by browser chrome (address bar, navigation bar), leading to layout issues or jumping.
- **Solution:** Use `min-h-[100dvh]` (Dynamic Viewport Height) for all root-level containers.
- **Implementation:** 
  - Update `AuthGate.tsx` main wrappers.
  - Update `MainContainer.tsx` main element.

### 2. Enhanced Skeleton System
- **Problem:** Current `pulse` animation is generic and doesn't provide a high-end feel.
- **Solution:** Implement a shimmering gradient animation.
- **Implementation:**
  - Add `shimmer` keyframes and animation to `tailwind.config.js`.
  - Update `src/components/atoms/ui/skeleton.tsx` to use the shimmer animation.
  - Update `AlbumSkeleton.tsx` and `TrackSkeleton.tsx` to match the actual layout more closely (e.g., adding artist line, song count).

### 3. Tactile Interaction Feedback
- **Problem:** Lack of visual feedback when tapping buttons/cards makes the app feel "dead".
- **Solution:** Add a subtle scale-down effect on the `:active` state.
- **Implementation:**
  - Add `active:scale-[0.98]` to `buttonVariants` in `button.tsx`.
  - Add `active:scale-[0.98]` to `PlaylistCard.tsx`.
  - Apply to other interactive links/buttons in `AlbumsTemplate.tsx`, `BottomTabBar.tsx`, and `PlayerBar.tsx`.

### 4. Safe-Area & Z-Index Compliance
- **Problem:** `PlayerBar` positioning might conflict with safe areas on newer mobile devices or have incorrect layering.
- **Solution:** Use `env(safe-area-inset-bottom)` for relative positioning and define a strict z-index scale.
- **Implementation:**
  - Update `PlayerBar.tsx` to use `bottom-[calc(96px+env(safe-area-inset-bottom))]`.
  - Verify `z-index` hierarchy: `BottomTabBar` (50) > `PlayerBar` (40) > Content (0).

### 5. Animation Performance
- **Problem:** Perpetual animations (like loading spinners) can cause layout thrashing if not isolated.
- **Solution:** Use hardware acceleration hints.
- **Implementation:**
  - Add `will-change-transform` and `translate-z-0` to the spinning loader in `AuthGate.tsx`.

## Files to Modify
- `tailwind.config.js`
- `src/components/auth/AuthGate.tsx`
- `src/components/layout/MainContainer.tsx`
- `src/components/atoms/ui/skeleton.tsx`
- `src/components/atoms/AlbumSkeleton.tsx`
- `src/components/atoms/TrackSkeleton.tsx`
- `src/components/atoms/ui/button.tsx`
- `src/components/molecules/Playlist/PlaylistCard.tsx`
- `src/components/molecules/Navigation/BottomTabBar.tsx`
- `src/components/molecules/PlayerBar.tsx`
- `src/components/templates/AlbumsTemplate.tsx`

## Verification Plan
- **Visual Check:** Verify shimmer effect on reload.
- **Interaction Check:** Tap buttons and cards to ensure the scale-down effect triggers.
- **Layout Check:** Verify bottom padding and positioning on mobile viewport simulations (especially safe areas).
- **Performance Check:** Ensure no layout thrashing in dev tools when the loader is active.

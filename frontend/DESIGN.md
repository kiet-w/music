# Design System: Music Ecosystem Website (Stitch Semantic System)

## 1. Visual Theme & Atmosphere
- **Atmosphere:** A sleek, gallery-airy monochromatic music studio interface (`#09090B` Deep Space Canvas with `#13151E` Elevated Card Surfaces). It delivers high-contrast clarity, glassmorphism depth, and tactile interactions without visual bloat.
- **Density Score:** 4/10 (Art Gallery Airy - Generous whitespace, clean typography, uncluttered layout).
- **Variance Score:** 8/10 (Offset Asymmetric layouts, floating cards with generous corner radii `rounded-[2.5rem]`).
- **Motion Score:** 7/10 (Fluid spring-physics motion, tactile button states, hardware-accelerated transitions).

## 2. Color Palette & Roles
- **Deep Space Canvas** (`#09090B`) — Primary background surface (`bg-background`).
- **Elevated Card Surface** (`#13151E`) — Card & container fill (`bg-card`).
- **Pure Contrast White** (`#FFFFFF`) — Primary text, primary CTA buttons, active state indicators (`text-foreground`).
- **Muted Slate** (`#71717A`) — Secondary text, metadata, subtle labels (`text-muted-foreground`).
- **Whisper Structural Line** (`rgba(255,255,255,0.08)`) — 1px structural dividers (`border-border`).
- **Critical Action Red** (`#FF3B30`) — Restricted accent for destructive actions (logout, delete).
- **Banned Colors:** Pure black (`#000000`), AI Purple/Violet Neon (`#8B5CF6`), gradient text fill, oversaturated accent colors. Strictly two-tone monochromatic.

## 3. Typography Rules
- **Display / Title:** `Instrument Sans` / `Cabinet Grotesk` / `Outfit` — Track-tight (-0.04em) scale hierarchy driven by weight and contrast.
- **Body / Content:** `Geist` — Regular (400), relaxed leading (1.5), 65ch max line length for high legibility.
- **Mono / Technical:** `JetBrains Mono` / `Geist Mono` — Timestamps, track IDs, friend codes, metadata.
- **Banned Typography:** `Inter` (forbidden for premium contexts), generic system fonts (`Arial`, `Times New Roman`). Serif fonts banned in dashboard views.

## 4. Component Stylings
- **Buttons:** Tactile -1px translate on active press (`active:scale-95`). Pure Contrast fill (`bg-white text-black`) for primary, ghost/outline (`bg-transparent border border-white/10`) for secondary. Shape matches inputs (`rounded-xl`).
- **Cards:** Generously rounded corners (`rounded-[2.5rem]`), 1px crisp structural border (`border-white/10`), solid dark surface (`bg-card`). Zero colored outer glows.
- **Inputs & Forms:** `bg-background/50`, `rounded-xl`, 1px `border-white/10`. Focus ring with white opacity. Clean labels above inputs.
- **Overlays & Modals:** Skeletal shimmers for list loaders, unified `GlobalLoading` floating popup for app state transitions. Extreme rounding (`rounded-[2.5rem]`) and structural 1px borders.

## 5. Layout Principles
- Single unified Desktop & Mobile Responsive Web Layout Shell.
- Desktop View (>= 768px): Unified Navigation Sidebar / Top Header + Main Content Viewport + Floating PlayerBar.
- Mobile View (< 768px): Single-column layout with fixed bottom navigation tab bar and responsive top bar.
- Spatial separation: No overlapping text or absolute content collisions. Clean flex/grid containers with generous gaps (`gap-4`, `gap-6`, `gap-8`).

## 6. Motion & Interaction
- Tactile physical depress on interactive elements (`active:scale-95`).
- Transitions: Hardware-accelerated transforms (`transform`, `opacity`) with `duration-300 ease-out`.
- Staggered cascade reveals for track lists and album cards.

## 7. Anti-Patterns & Constraints (Banned)
- 🚫 **NO MODIFICATION OF CSS FILES:** Preserving existing CSS files without changes is a hard requirement. All styling is applied via existing Tailwind tokens and TSX component structures.
- 🚫 **NO Emojis** anywhere in the interface.
- 🚫 **NO `Inter` Font** or raw system fallbacks.
- 🚫 **NO Pure Black (`#000000`)**.
- 🚫 **NO AI Purple Glows**, neon drop shadows, or gradient headers.
- 🚫 **NO Unlocalized Hardcoded Text** (100% managed via `vi.json` and `en.json`).
- 🚫 **NO Breaking Critical API Contracts** (`lib/api.ts` or Zustand stores).

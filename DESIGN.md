# Design System: Music Ecosystem Website (Stitch Semantic System)

## 1. Visual Theme & Atmosphere
- **Atmosphere:** A sleek, gallery-airy monochromatic music studio interface (`#09090B` Deep Space Canvas with `#121215` Elevated Card Surfaces). It delivers high-contrast clarity, glassmorphism depth, and tactile interactions with a strict two-tone Black & White color scheme where dark surfaces dominate 85–90% of the screen area, and crisp white is used for text, primary CTAs, and structural accents.
- **Density Score:** 4/10 (Art Gallery Airy - Generous whitespace, clean typography, uncluttered layout).
- **Variance Score:** 8/10 (Offset Asymmetric layouts, floating cards with generous corner radii `rounded-3xl` / `rounded-[2.5rem]`).
- **Motion Score:** 7/10 (Fluid spring-physics motion, tactile button states, hardware-accelerated transitions).

## 2. Color Palette & Roles
- **Dominant Dark Canvas** (`#09090B` / `bg-background`) — Primary background surface (occupies 85–90% visual space).
- **Elevated Dark Surface** (`#121215` / `bg-zinc-900`) — Card and container background fill.
- **Pure Contrast White** (`#FFFFFF` / `text-white`, `bg-white`) — Primary text, primary CTA buttons, active state indicators.
- **Muted Platinum** (`#A1A1AA` / `text-zinc-400`, `text-white/60`) — Secondary text, metadata, descriptions.
- **Whisper Structural Line** (`rgba(255,255,255,0.1)` / `border-white/10`, `border-white/20`) — 1px structural dividers and crisp border lines.
- **Banned Colors:** Amber/Yellow (`#F59E0B`, `amber-400`, `amber-500`), Neon/Purple (`#8B5CF6`), gradient text fills, oversaturated color accents. Strictly two-tone Monochromatic (Black & White).

## 3. Typography Rules
- **Headlines & Titles:** `Instrument` (`font-instrument`) — All section titles, page headers, hero headlines, and card titles MUST use `font-instrument`. Track-tight (-0.04em) scale hierarchy driven by weight and serif/editorial contrast.
- **Body & Content:** `Geist` — Regular (400), relaxed leading (1.5), 65ch max line length for high legibility.
- **Mono & Technical:** `JetBrains Mono` / `Geist Mono` — Timestamps, track counts, track IDs, metadata.
- **Banned Typography:** `Inter` (forbidden for premium contexts), generic system fallbacks (`Arial`, `Times New Roman`).

## 4. Component Stylings
- **Buttons:** Tactile -1px translate on active press (`active:scale-95`). Pure Contrast White fill (`bg-white text-black hover:bg-zinc-200`) for primary CTAs; Ghost/Subtle Outline (`bg-white/10 text-white border border-white/20 hover:bg-white/20`) for secondary buttons. Shape matches rounded containers (`rounded-full` or `rounded-xl`).
- **Cards:** Generously rounded corners (`rounded-3xl` or `rounded-[2.5rem]`), 1px crisp white structural border (`border-white/10`), solid dark surface (`bg-zinc-900/90`). Zero colored outer glows or colored halos.
- **Inputs & Forms:** `bg-white/5`, `rounded-xl`, 1px `border-white/10`. Focus ring with white opacity (`focus:border-white/40`). Clean labels above inputs.
- **Overlays & Modals:** Skeletal shimmers for list loaders, unified `GlobalLoading` floating popup for app state transitions. Extreme rounding (`rounded-[2.5rem]`) and structural 1px white borders (`border-white/10`).

## 5. Layout Principles
- Single unified Desktop & Mobile Responsive Web Layout Shell.
- Desktop View (>= 768px): Unified Navigation Sidebar / Top Header + Main Content Viewport + Floating PlayerBar.
- Mobile View (< 768px): Single-column layout with fixed bottom navigation tab bar and responsive top bar.
- Spatial separation: No overlapping text or absolute content collisions. Clean flex/grid containers with generous gaps (`gap-4`, `gap-6`, `gap-8`).
- Asymmetric Hero splits and grid containment (`max-w-[1400px]`).

## 6. Motion & Interaction
- Tactile physical depress on interactive elements (`active:scale-95`).
- Transitions: Hardware-accelerated transforms (`transform`, `opacity`) with `duration-300 ease-out`.
- Staggered cascade reveals for track lists and album cards.

## 7. Anti-Patterns & Constraints (Banned)
- 🚫 **NO Amber, Yellow, or Neon Colors** (`amber-500`, `amber-400`, `amber-500/20`, etc.).
- 🚫 **NO Colored Glows or Outer Halos** — only white/zinc monochrome highlights and borders (`border-white/20`, `bg-white/10`).
- 🚫 **NO Emojis** anywhere in the interface.
- 🚫 **NO `Inter` Font** or raw system fallbacks.
- 🚫 **NO Pure Black (`#000000`)** — use off-black canvas (`#09090B`, `#121215`).
- 🚫 **NO Non-Instrument Titles** — All headings MUST use `font-instrument`.
- 🚫 **NO Modification of API Layer or Zustand Stores** (`lib/api.ts`, stores).


# Design System: Music Web & Mobile Application

## 1. Visual Theme & Atmosphere
- **Atmosphere:** A modern, dark-mode glassmorphic interface inspired by high-end digital audio workstations and premium streaming platforms.
- **Density:** 5 (Balanced & Spatially Clean)
- **Variance:** 7 (Offset & Modern Dynamic Layouts)
- **Motion:** 6 (Fluid CSS with Framer Motion Spring Physics)

## 2. Color Palette & Roles
- **Canvas Deep Dark** (`#0A0A0C`) — Primary background canvas surface
- **Glass Surface** (`#141416`) — Card and popover fill, 95% opacity with backdrop-blur
- **Primary Ink** (`#FFFFFF`) — Primary text & headings, 90-100% opacity
- **Muted Steel** (`#A1A1AA`) — Secondary text, metadata, descriptions, 60-70% opacity
- **Whisper Border** (`rgba(255,255,255,0.1)`) — Structural dividers and 1px component borders
- **Emerald Accent** (`#10B981`) — Functional accent for active states, selected options, and playback progress
- **Banned Colors:** Pure `#000000` (causes harsh contrast), oversaturated AI purple/cyan outer glows.

## 3. Typography Rules
- **Display & Headings:** `Geist` / Sans-serif — Track-tight, weight-driven hierarchy
- **Body Text:** `Inter` / System UI — Relaxed leading, maximum 65ch width for ideal readability
- **Monospace:** `Geist Mono` — Timestamps, track durations, bitrate metadata
- **Banned:** Generic serif fonts (`Times New Roman`, `Georgia`) in software/audio controls.

## 4. Component Stylings

### Custom Dropdowns & Select Components (`CustomSelect`)
- **Trigger:** Height 44px (`h-11`), rounded-xl (`rounded-12px`), translucent background (`bg-background/50`), subtle 1px border (`border-white/10`). Rotatable `ChevronDown` indicator.
- **Popover Menu:** Floating dark glass popover (`bg-[#141416]/95 backdrop-blur-xl border border-white/15 shadow-2xl rounded-2xl p-1.5`).
- **Option Item:** High-tactile row with custom left icons (`Disc` for Single, `Music` for Album) and description text. Active state highlighted with subtle emerald tint (`bg-emerald-500/15 text-emerald-300`) and a crisp `Check` icon.
- **Banned Pattern:** Native browser HTML `<select>` elements with clunky OS radio buttons and solid black boxes.

### Buttons & Inputs
- **Inputs:** Translucent background, rounded-xl, 1px border. Glowing emerald ring on focus (`focus:border-emerald-500/50`).
- **Primary CTA:** High contrast, rounded-xl button with active micro-scale press effect (`active:scale-95`).

## 5. Layout Principles
- **Spatial Isolation:** Floating popovers sit above content with `z-50` and clear elevation shadows (`shadow-2xl shadow-black/80`).
- **Responsive Collapse:** Dropdowns scale seamlessly from mobile touch screens (minimum 44px tap target) to wide desktop views.

## 6. Motion & Interaction
- **Spring Physics:** `initial={{ opacity: 0, y: -6, scale: 0.98 }}` to `animate={{ opacity: 1, y: 0, scale: 1 }}` using `AnimatePresence`.
- **Rotational Feedback:** `ChevronDown` rotates 180° upon menu toggling.

## 7. Anti-Patterns (Banned)
- NO native OS dropdown overlays with giant radio bullets
- NO pure black (`#000000`) surfaces without depth or blur
- NO non-responsive horizontal overflow
- NO layout shifts when opening or selecting dropdown items

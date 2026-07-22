# Design System: Google Music App (Stitch Semantic System)

## 1. Visual Theme & Atmosphere
- **Atmosphere:** A brutally minimalist, high-contrast monochromatic interface that feels like a premium, underground music studio. It relies entirely on structural borders, extreme border-radii, and stark black/white contrast rather than color to communicate hierarchy.
- **Density Score:** 4/10 (Art Gallery Airy - Generous whitespace, large typography, and uncluttered cards).
- **Variance Score:** 8/10 (Offset Asymmetric layouts, floating cards with varied corner radii, and striking typography scale).
- **Motion Score:** 7/10 (Fluid CSS transitions, tactile active states for buttons, and smooth spring-based modal entrances).

## 2. Color Palette & Roles
- **Deep Space Canvas** (`#09090B`) — Primary background surface for the entire application (`bg-background`).
- **Elevated Card Surface** (`#13151E`) — Card and container fill (`bg-card`). Slightly lighter than canvas to create depth without relying on drop shadows.
- **Pure Contrast** (`#FFFFFF`) — Primary text, primary CTA buttons, and active icons (`text-foreground`).
- **Muted Slate** (`#71717A`) — Secondary text, descriptions, metadata (`text-muted-foreground`).
- **Whisper Structural Line** (`rgba(255,255,255,0.08)`) — 1px structural borders used on all cards, inputs, and dividers (`border-border`).
- **Critical Action** (`#FF3B30`) — Singular restricted accent used ONLY for destructive actions (like Logout or Delete). No other accents allowed.
- **Banned Colors:** Pure black (`#000000`), AI Purple/Violet Neon (`#8B5CF6`), Neon Emerald/Teal, any gradient texts, and any oversaturated accent colors. The app is strictly two-tone (Black & White).

## 3. Typography Rules
- **Display / Title:** `Instrument Sans` or `Cabinet Grotesk` — Used for massive, track-tight (-0.04em) page headers (e.g., "Tài Khoản", "Âm Nhạc"). Hierarchy is driven by extreme scale rather than color.
- **Body / Message:** `Geist` — Regular (400), relaxed leading (1.5), max 65 characters per line for high readability.
- **Mono / Timestamp:** `JetBrains Mono` or `Geist Mono` — Used for track IDs, emails, timestamps, and high-density technical metadata.
- **Banned Typography:** `Inter` (strictly forbidden for premium contexts), generic system fonts (`Arial`, `Times New Roman`). Serif fonts are banned in this UI.

## 4. Component Stylings

### A. Surface Cards (The Core Building Block)
- **Shape & Bounds:** Generously rounded corners (`rounded-[2.5rem]` / 40px radius). This extreme rounding is the signature aesthetic.
- **Surface Treatment:** Solid dark fill (`bg-card`) with a 1px crisp structural stroke (`border-border`). NEVER use colored outer glows or heavy drop shadows.
- **Padding:** Spacious internal padding (e.g., `p-6` or `p-8`).

### B. Inputs & Forms
- **Container:** `bg-background/50` or completely transparent.
- **Shape:** `rounded-xl` (12px radius) to contrast with the extreme rounding of the parent cards.
- **Borders:** 1px `border-white/5` or `border-white/10`. Focus rings must use subtle white opacity, not neon blue/purple.
- **Labels:** Floating placeholders or explicit labels above inputs. No complex floating animations.

### C. Buttons (Primary & Secondary)
- **Primary CTA:** Solid Pure Contrast (`bg-white text-black`). Flat, no gradients, no outer glow. Tactile scale-down on active (`active:scale-95`). Shape matches inputs (`rounded-xl`).
- **Secondary CTA:** Ghost or Outline (`bg-transparent border border-white text-white`). 
- **Destructive:** `bg-destructive/10 text-destructive` for high-risk actions.

### D. Overlays & Modals
- **Loading States:** Centered popups with `bg-black/80 backdrop-blur-md`, using a simple loader icon. Never use generic full-page spinners; use structural skeletal shimmers when rendering lists.
- **Modals:** Same extreme rounding (`rounded-[2.5rem]`) and structural 1px border.

## 5. Layout & Responsive Positioning Strategy
- **Container Architecture:** All main pages use a constrained `<MainContainer>` wrapper with maximum width limits (e.g., `max-w-xl` or `max-w-[360px]` for mobile-first views).
- **Scrolling Behavior:** 
  - Standard pages rely on natural `body` vertical scrolling.
  - If global body scrolling is disabled (`overflow: hidden`), the scroll host MUST be explicitly declared within the container using `flex-1 min-h-0 overflow-y-auto` while the parent holds `h-[100dvh] overflow-hidden flex flex-col`.
- **Spatial Separation:** Zero overlapping text or absolute content collisions. Everything breathes in flex columns with generous gaps (`gap-4`, `gap-6`, `gap-8`).

## 6. Motion & Physics Specifications
- **Micro-Interactions:** Buttons depress physically when clicked (`active:scale-95`).
- **Transitions:** All color, opacity, and transform changes use `transition-all duration-300 ease-out`.
- **Entrance Animation:** Page mounts and component reveals use subtle vertical slides with fade-ins (`y: 10, opacity: 0` to `y: 0, opacity: 1`).
- **Loading Spinners:** Simple `animate-spin` on Lucide icons. No complex Lottie animations.

## 7. Anti-Patterns (Banned AI Tells)
- 🚫 **NO Emojis** anywhere in the UI (use custom Lucide SVG iconography only).
- 🚫 **NO `Inter` Font** or browser fallback default fonts.
- 🚫 **NO Pure Black (`#000000`)** backgrounds. Use `#09090B` or `#13151E`.
- 🚫 **NO AI Purple Glows**, neon drop shadows, or gradient backgrounds. The app is strictly Monochromatic (Black/White).
- 🚫 **NO Generic Names** ("John Doe", "Track 1"). Use realistic metadata.
- 🚫 **NO 3-Column Equal Grids** for features. Use asymmetric vertical stacks or 2-column zig-zags.
- 🚫 **NO Filler UI Text** ("Scroll to explore", "Elevate your experience"). Let the UI speak for itself.
- 🚫 **NO Mixed Border Radii** without logic. Parent cards are ALWAYS `2.5rem`, inner interactive elements (inputs, buttons) are ALWAYS `xl` (0.75rem).

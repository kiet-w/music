# Design: Task 3 Part 2 - Core Pages & Skeletons

## Overview
Refactor core molecule components to use Tailwind CSS and Shadcn UI, implement the Home page with featured albums, and create loading states and album detail pages.

## 1. Component Refactoring

### 1.1 Downloader Refactoring
- **Path:** `src/components/molecules/Downloader/Downloader.tsx`
- **Changes:**
  - Remove `Downloader.css` import.
  - Use `useTranslations('Music')`.
  - Use `Button` from `@/components/atoms/ui/button`.
  - Use standard `<input>` with Tailwind classes (matching Shadcn UI style if possible, or just standard `border border-input px-3 py-2`).
  - Layout: Flex container with input and button.
  - Status messages styled with `text-sm text-muted-foreground`.

### 1.2 Player Refactoring
- **Path:** `src/components/molecules/Player/Player.tsx`
- **Changes:**
  - Remove `Player.css` import.
  - Use `useTranslations('Music')`.
  - Use `Button` for play/pause.
  - Use Tailwind for layout (flex, spacing).
  - Use `lucide-react` icons (Play, Pause, Volume2) instead of text labels.
  - Progress and volume sliders: Standard `<input type="range">` with Tailwind styling.

## 2. Home Page Implementation
- **Path:** `app/[locale]/page.tsx`
- **Changes:**
  - Add `MOCK_ALBUMS` data.
  - Grid of `Card` components for "Featured Albums".
  - Each card links to `/album/[id]`.
  - Keep `Library` and `Downloader` components.
  - Layout: `max-w-4xl mx-auto p-6 space-y-12`.

## 3. Loading States
- **Paths:** 
  - `app/[locale]/loading.tsx`
  - `app/[locale]/album/[id]/loading.tsx`
- **Design:**
  - Home loading: Grid of `AlbumSkeleton` + `TrackSkeleton` list.
  - Album loading: Header skeleton + `TrackSkeleton` list.

## 4. Album Detail Page
- **Path:** `app/[locale]/album/[id]/page.tsx`
- **Changes:**
  - `generateStaticParams` for mock IDs (e.g., '1', '2', '3').
  - Display album cover, title, artist.
  - List of tracks (mocked or filtered from a larger set).
  - "Play all" button.

## 5. Cleanup
- Delete:
  - `src/components/molecules/Library/Library.css`
  - `src/components/molecules/Downloader/Downloader.css`
  - `src/components/molecules/Player/Player.css`

## Testing Strategy
- Manual verification of UI appearance.
- Check i18n switching (if possible, or just verify keys).
- Verify navigation between Home and Album details.

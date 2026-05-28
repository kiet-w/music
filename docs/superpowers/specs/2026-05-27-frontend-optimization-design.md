# Spec: Frontend Performance Optimization

## Goal
Optimize React frontend components using `useMemo` for efficient rendering and `reduce` for data transformation/statistics.

## Target Components

### 1. Library Component (`frontend/src/components/molecules/Library/Library.tsx`)
- **Optimization:** Use `useMemo` to memoize the list of tracks.
- **Data Transformation:** Use `reduce` to calculate the total duration of all tracks in the library.
- **Benefit:** Prevents re-formatting durations and re-calculating stats on every re-render unless the `tracks` array changes.

### 2. Home Page (`frontend/src/app/[locale]/page.tsx`)
- **Optimization:** Use `useMemo` to memoize the sliced and processed list of albums.
- **Data Transformation:** Use `reduce` to calculate the total number of songs across all fetched albums.
- **Benefit:** Efficiently manages the top albums list and provides an aggregate metric without redundant calculations.

### 3. Playlist Grid (`frontend/src/components/molecules/Playlist/PlaylistGrid.tsx`)
- **Optimization:** Use `useMemo` to memoize the demo playlists and their layout assignments (Bento grid logic).
- **Data Transformation:** Use `reduce` to group or categorize playlists (e.g., by song count ranges).
- **Benefit:** Ensures layout calculations only happen when the playlist data changes.

## Verification
- Verify that components render correctly.
- Check that calculations (totals, counts) are accurate.
- Ensure no regressions in functionality (e.g., track selection still works).

# Spec: Frontend Lazy Loading Optimization

## Goal
Improve initial load time and reduce bundle size by applying lazy loading to non-critical components and media assets.

## Target Optimizations

### 1. Component Lazy Loading (`next/dynamic`)
- **`Library` Component:** Lazy load `AddToPlaylistDialog`. This dialog is only needed when a user clicks the "Add to Playlist" button.
- **`HomePage` Component:** Lazy load `PlaylistGrid`. This grid is a separate section that can be loaded asynchronously to speed up the rendering of the core album list.

### 2. Image Lazy Loading
- **All standard `<img>` tags:** Add `loading="lazy"` attribute.
- **Benefit:** Prevents the browser from downloading images that are not currently in the viewport, saving data and improving perceived performance on mobile devices.

## Verification
- Ensure components still load correctly when needed (e.g., clicking "Add to Playlist").
- Verify that `PlaylistGrid` appears on the home page after a short delay or skeleton.
- Check that images have the `loading="lazy"` attribute in the DOM.

# Design Doc: Hide Google Drive in AlbumDetailClient

**Status:** Proposed
**Date:** 2026-05-24
**Topic:** Task 20 - Hide Google Drive V1 UI

## 1. Purpose
The Google Drive import feature is out of scope for the V1 release. This design aims to hide the entry points and clean up the associated logic in the `AlbumDetailClient` component to prevent user confusion and reduce code clutter.

## 2. Changes

### 2.1 UI Changes
- Remove the "Import từ Drive" button in `AlbumDetailClient`.
- Remove the `DrivePicker` component instance.

### 2.2 Logic Changes
- Remove `useGoogleDrive` hook and its returned values (`login`, `listFiles`, `accessToken`, `files`, `isLoading`).
- Remove `isDrivePickerOpen` state.
- Remove `handleImportClick` function.
- Remove `useEffect` that depends on `googleToken`.
- Remove `Upload` icon and `DrivePicker` dynamic import.

## 3. Success Criteria
- The "Import từ Drive" button is no longer visible.
- No Google Drive related logic runs on the album detail page.
- The page renders correctly and allows normal album/track interaction.
- No build errors or lint warnings related to unused variables introduced by this change.

## 4. Alternatives Considered
- **Commenting out:** Leaving the code in place but commented. *Rejected* because removal is cleaner and the code is still available in git history if needed later.
- **Conditional rendering:** Hiding based on a flag. *Rejected* because V1 specifically mandates hiding it.

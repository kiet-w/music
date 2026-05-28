# Design Spec: Real-time Home Page Updates

## Goal
Implement real-time updates for the home page so that when albums are added or updated in the database (e.g., via the YouTube downloader), the home page reflects these changes immediately without a manual refresh.

## Architecture
We will use the existing `useSupabaseRealtime` hook to subscribe to changes in the `Album` table.

### Data Flow
1. The `HomePage` component subscribes to the `Album` table changes on mount.
2. When an `INSERT` or `UPDATE` event occurs in the `Album` table, Supabase notifies the client.
3. The client receives the event and triggers a re-fetch of all albums using the `fetchAlbums` API function.
4. The local state `albums` is updated, triggering a re-render.

## Components
- `HomePage` (`frontend/src/app/[locale]/page.tsx`): Will be updated to include the real-time subscription.

## Implementation Details
- Import `useSupabaseRealtime` from `@/hooks/useSupabaseRealtime`.
- Define a `refreshAlbums` function that calls `fetchAlbums` and updates the `albums` state.
- Use `useSupabaseRealtime('Album', refreshAlbums)`.
- Use `useCallback` for `refreshAlbums` to ensure the hook doesn't re-subscribe unnecessarily.

## Testing
1. Open the home page.
2. Manually insert or update an album in the Supabase database.
3. Verify that the home page updates automatically.
4. (Optional) Use the YouTube downloader and verify that the newly created album appears on the home page once the download/conversion is complete.

## Alternatives Considered
- **Optimistic State Update:** Instead of re-fetching, we could merge the `payload.new` into the local state. However, the `Album` table on the home page includes a `_count` for songs, which might not be accurately reflected in the simple realtime payload of the `Album` table. Re-fetching ensures we get the latest computed counts and all related data.

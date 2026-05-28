# Design Doc: Real-time Updates with Supabase Realtime

## 1. Overview
Implement real-time updates for Home, Album, and Music pages to ensure data consistency and immediate feedback without manual refreshes or inefficient polling.

## 2. Goals
- Eliminate 2-second polling in `Downloader` component.
- Automatically refresh Home page "Recently Played" and "Playlists" when new albums/songs are added.
- Automatically refresh Album detail page when new tracks are added to the album.

## 3. Architecture
- **Infrastructure:** Enable Realtime on `Track` and `Album` tables in Supabase.
- **Frontend:** 
    - Install `@supabase/supabase-js`.
    - Create a central Supabase client.
    - Implement a `useSupabaseRealtime` hook to subscribe to database changes.
    - Use events to trigger data re-fetching or state updates.

## 4. Components
### Frontend
- `lib/supabase.ts`: Supabase client initialization.
- `hooks/useRealtime.ts`: Custom hook for table subscriptions.
- `app/[locale]/page.tsx`: Updated to listen for Album/Track changes.
- `app/[locale]/music/page.tsx`: Updated to listen for Track conversion status.
- `components/molecules/Downloader/Downloader.tsx`: Replaced polling with Realtime listener.

### Backend
- Ensure environment variables for Supabase are correctly set (already integrated).

## 5. Implementation Plan (High Level)
1. Install dependencies.
2. Setup Supabase client in frontend.
3. Create Realtime hook.
4. Integrate hook into Home, Album, and Downloader components.
5. Verify real-time triggers.

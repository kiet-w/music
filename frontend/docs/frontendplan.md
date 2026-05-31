# Frontend Plan: Private User Library V1

> Track progress by ticking each checkbox. Scope: login/register UI, auth hydration, protected album/song APIs, and private-library UI behavior. Google Drive is hidden/out of scope for v1.

## Task 1: Audit Frontend Current State

**Files to inspect**
- `frontend/src/lib/api.ts`
- `frontend/src/store/useAuthStore.ts`
- `frontend/src/components/auth/*`
- `frontend/src/app/[locale]/layout.tsx`
- `frontend/src/app/[locale]/page.tsx`
- `frontend/src/app/[locale]/albums/*`
- `frontend/src/app/[locale]/music/page.tsx`
- `frontend/src/components/molecules/Library/Library.tsx`
- `frontend/src/components/molecules/Downloader/Downloader.tsx`

- [x] Confirm auth store exists or needs creation.
- [x] Confirm login/register pages exist or need creation.
- [x] Find all API calls to albums/songs.
- [x] Find all Server Components that call protected APIs.
- [x] Find all visible Google Drive entry points.

**Acceptance**
- Implementer knows every frontend place affected by private auth.

## Task 2: Configure API Base URL

**File**
- `frontend/src/lib/api.ts`

- [x] Replace hard-coded-only API URL with env fallback.

Target:

```ts
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002';
```

- [x] Keep `.replace(/\/$/, '')`.

**Acceptance**
- Local dev still works and deploy can set `NEXT_PUBLIC_API_URL`.

## Task 3: Add Auth API Types

**File**
- `frontend/src/lib/api.ts`

- [x] Export `AuthUser`.
- [x] Export `AuthResponse`.

Target:

```ts
export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};
```

**Acceptance**
- Auth store and auth pages can import these types.

## Task 4: Add Auth Header Helper

**File**
- `frontend/src/lib/api.ts`

- [x] Add `getAuthHeaders(appToken)`.
- [x] Preserve existing JSON/tunnel/ngrok headers.

Target:

```ts
export function getAuthHeaders(appToken?: string) {
  return {
    ...headers,
    ...(appToken ? { Authorization: `Bearer ${appToken}` } : {}),
  };
}
```

**Acceptance**
- All protected API functions share one auth header helper.

## Task 5: Add Auth API Functions

**File**
- `frontend/src/lib/api.ts`

- [x] Add `register(data): Promise<AuthResponse>`.
- [x] Add `login(data): Promise<AuthResponse>`.
- [x] Add `fetchMe(appToken): Promise<AuthUser>`.
- [x] Map `409` register response to readable duplicate email error.
- [x] Map `401` login response to readable invalid credentials error.

**Acceptance**
- Login/register pages do not duplicate fetch logic.

## Task 6: Convert Album API Functions

**File**
- `frontend/src/lib/api.ts`

- [x] `fetchAlbums(appToken, options?)`.
- [x] `createAlbum(appToken, data)`.
- [x] `fetchAlbum(appToken, id)`.
- [x] Ensure each sends `Authorization`.
- [x] Ensure create album body does not contain `userId`.

**Acceptance**
- Album APIs cannot be called without app JWT.

## Task 7: Convert Song API Functions

**File**
- `frontend/src/lib/api.ts`

- [x] `fetchTracks(appToken)`.
- [x] `fetchTrack(appToken, id)`.
- [x] `downloadFromYoutube(appToken, url, title, artist?, albumId?)`.
- [x] `deleteTrack(appToken, id)`.
- [x] `moveTrackToAlbum(appToken, id, albumId)`.
- [x] Ensure each sends `Authorization`.
- [x] Ensure no song request sends `userId`.

**Acceptance**
- Song APIs cannot be called without app JWT.

## Task 8: Create or Fix Auth Store

**File**
- `frontend/src/store/useAuthStore.ts`

- [x] Store `user`.
- [x] Store `accessToken`.
- [x] Store `isHydrated`.
- [x] Implement `setSession(accessToken, user)`.
- [x] Implement `clearSession()`.
- [x] Use localStorage key `music.auth`.

**Acceptance**
- Store can persist and clear auth state.

## Task 9: Implement `/auth/me` Hydration

**File**
- `frontend/src/store/useAuthStore.ts`

- [x] `hydrate()` reads `music.auth`.
- [x] If no stored session, mark hydrated.
- [x] If stored session is invalid JSON, remove `music.auth` and mark hydrated.
- [x] If token exists, call `fetchMe(token)`.
- [x] If `fetchMe` succeeds, keep token and update user from backend.
- [x] If `fetchMe` fails or returns `401`, clear store and `localStorage.removeItem('music.auth')`.
- [x] Always set `isHydrated = true` at the end.

**Acceptance**
- Expired/broken token cannot create refresh loop.

## Task 10: Add Login Page

**File**
- `frontend/src/app/[locale]/login/page.tsx`

- [x] Render email field.
- [x] Render password field.
- [x] Submit calls `login`.
- [x] Success calls `setSession`.
- [x] Success redirects to `/{locale}`.
- [x] Error state handles invalid credentials.
- [x] Link to `/{locale}/register`.

**Acceptance**
- User can login and enter protected app.

## Task 11: Add Register Page

**File**
- `frontend/src/app/[locale]/register/page.tsx`

- [x] Render optional name field.
- [x] Render email field.
- [x] Render password field.
- [x] Submit calls `register`.
- [x] Success calls `setSession`.
- [x] Success redirects to `/{locale}`.
- [x] Error state handles duplicate email.
- [x] Link to `/{locale}/login`.

**Acceptance**
- User can register and immediately enter protected app.

## Task 12: Add AuthGate

**File**
- `frontend/src/components/auth/AuthGate.tsx`

- [x] Run `hydrate()` once on mount.
- [x] Public routes: `/{locale}/login`, `/{locale}/register`.
- [x] Protected routes: all other app pages.
- [x] Show compact loading UI while hydrating.
- [x] Redirect unauthenticated protected routes to login.
- [x] Redirect authenticated login/register routes to home.

**Acceptance**
- Protected UI waits for auth state.

## Task 13: Update Locale Layout

**File**
- `frontend/src/app/[locale]/layout.tsx`

- [x] Wrap children with `AuthGate`.
- [x] Keep `NextIntlClientProvider`.
- [x] Keep app shell styling.
- [x] Hide `PlayerBar` and `BottomTabBar` on login/register if they clutter auth pages.

**Acceptance**
- Auth pages are public; app pages are protected.

## Task 14: Remove Protected Server Fetching

**Files**
- `frontend/src/app/[locale]/page.tsx`
- `frontend/src/app/[locale]/albums/page.tsx`
- `frontend/src/app/[locale]/albums/detail/page.tsx`

- [x] Remove protected backend fetch calls from Server Components.
- [x] Render client components only.
- [x] Pass route params/search params into client components when needed.

**Acceptance**
- Server Components do not call album/song APIs that require localStorage JWT.

## Task 15: Update Home Client

**File**
- `frontend/src/app/[locale]/HomePageClient.tsx`

- [x] Read `accessToken`, `isHydrated`, `clearSession`.
- [x] Fetch albums only when `isHydrated && accessToken`.
- [x] Call `fetchAlbums(accessToken)`.
- [x] On `401`, clear session and redirect login.

**Acceptance**
- Home shows only current user's albums.

## Task 16: Update Albums UI

**Files**
- `frontend/src/app/[locale]/albums/AlbumsClient.tsx`
- Related album components if needed.

- [x] Fetch albums only after auth hydrate.
- [x] Call `fetchAlbums(accessToken)`.
- [x] Create album with `createAlbum(accessToken, data)`.
- [x] Do not send `userId`.
- [x] On `401`, clear session and redirect.

**Acceptance**
- Album create/list works for logged-in user only.

## Task 17: Update Album Detail UI

**Files**
- `frontend/src/components/templates/AlbumDetailClient.tsx`
- `frontend/src/app/[locale]/albums/detail/page.tsx`

- [x] Fetch album only after auth hydrate.
- [x] Call `fetchAlbum(accessToken, id)`.
- [x] Handle `404` with not-found or redirect.
- [x] Handle `401` by clearing session.

**Acceptance**
- User cannot view another user's album detail.

## Task 18: Update Library UI

**File**
- `frontend/src/components/molecules/Library/Library.tsx`

- [x] Fetch tracks only after auth hydrate.
- [x] Call `fetchTracks(accessToken)`.
- [x] Delete with `deleteTrack(accessToken, id)`.
- [x] Move with `moveTrackToAlbum(accessToken, id, albumId)`.
- [x] On `401`, clear session and redirect.

**Acceptance**
- Library displays only current user's tracks.

## Task 19: Update Downloader UI

**File**
- `frontend/src/components/molecules/Downloader/Downloader.tsx`

- [x] Read app token from auth store.
- [x] Block submit if no token.
- [x] Call `downloadFromYoutube(accessToken, url, title, artist, albumId)`.
- [x] Do not send `userId`.
- [x] On `401`, clear session and redirect.

**Acceptance**
- Convert song requests are authenticated and tied to current user by backend.

## Task 20: Hide Google Drive V1 UI

**Files**
- `frontend/src/app/[locale]/music/page.tsx`
- `frontend/src/components/google-drive/DrivePicker.tsx`
- `frontend/src/hooks/useGoogleDrive.ts`

- [x] Remove or hide visible Google Drive import entry point.
- [x] Ensure page still renders cleanly without Drive section.
- [x] Do not call Google Drive APIs in v1 flow.
- [x] Leave code in place only if unused and harmless.

**Acceptance**
- User does not hit broken/out-of-scope Drive flow.

## Task 21: Add Logout Flow

**Files**
- `frontend/src/components/molecules/Navigation/BottomTabBar.tsx`
- Optional: `frontend/src/components/molecules/Navbar/Navbar.tsx`

- [x] Add logout action.
- [x] Logout calls `clearSession()`.
- [x] Logout removes `music.auth`.
- [x] Logout redirects to `/{locale}/login`.

**Acceptance**
- User can end session cleanly.

## Task 22: Frontend Verification

- [x] Run:

```bash
cd frontend
npm run build
```

- [x] Manual register.
- [x] Manual login.
- [x] Manual refresh with valid token.
- [x] Manual refresh with invalid token.
- [x] Manual logout.
- [x] Manual album create/list.
- [x] Manual song convert/list.
- [x] Confirm no visible Google Drive entry point.

**Acceptance**
- Frontend build and core user flow pass.

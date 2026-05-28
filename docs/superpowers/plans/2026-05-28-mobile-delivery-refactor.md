# Architectural Refactor Plan: Mobile App Delivery (Pending Decision)

**Goal:** Resolve the Next.js static export (`output: 'export'`) conflicts to allow the application to be delivered to mobile devices, either as a native APK via Capacitor or as a Progressive Web App (PWA).

**Current State & Problem:**
The application cannot currently be built as an APK. Capacitor requires a purely static HTML/JS/CSS export. However, the Next.js frontend uses:
1.  **Middleware (`middleware.ts`):** Used by `next-intl` for routing locales. Middleware is unsupported in static exports.
2.  **Dynamic Routes (`[id]/page.tsx`):** Lacking `generateStaticParams()`, which is required when using `output: 'export'`.

We have two distinct paths forward. A decision must be made before proceeding.

---

## Option 1: Refactor for Capacitor (Native APK)
*Choose this if a standalone installable APK is absolutely required.*

**Pros:** True native feel, access to native device file systems for robust offline storage.
**Cons:** Requires significant rewriting of the current routing and internationalization setup.

### Tasks for Option 1:
1.  **Remove Next.js Middleware:** Strip out `middleware.ts` and refactor `next-intl` to use static generation or client-side only routing.
2.  **Refactor Dynamic Routes:** Implement `generateStaticParams()` for all dynamic routes (e.g., Albums), or change them to be strictly Client Components that fetch their data based on URL parameters after the initial static shell loads.
3.  **Enable Static Export:** Add `output: 'export'` back to `next.config.js`.
4.  **Capacitor Sync:** Run `npx cap sync android` and generate the APK.

---

## Option 2: Convert to Progressive Web App (PWA)
*Choose this for the fastest path to a mobile-app-like experience without app store distribution.*

**Pros:** No need to rewrite Next.js routing/middleware. Users can "Install to Home Screen" directly from the browser. Easy to deploy via Vercel.
**Cons:** "Offline" storage relies on browser limits (IndexedDB/Cache API), which the OS can clear if the device runs low on space.

### Tasks for Option 2:
1.  **PWA Configuration:** Install `next-pwa` and configure `next.config.js` to generate a manifest and service worker.
2.  **Manifest & Icons:** Create `manifest.json` and required app icons for iOS/Android home screens.
3.  **Rewrite Offline Storage:** Remove `@capacitor/filesystem`. Rewrite `useOfflineStorage.ts` to utilize **IndexedDB** (via `localforage`) or the Service Worker Cache API to store audio blobs.
4.  **Deployment:** Deploy the app to a live URL (e.g., Render, Vercel) so it can be installed on the phone.

---

**Next Steps (For Tomorrow):**
1. Review this document.
2. Decide between **Option 1 (Capacitor/APK)** and **Option 2 (PWA)**.
3. Instruct the AI to begin executing the tasks for the chosen option.
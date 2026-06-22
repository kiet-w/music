# Implementation Plan - Fix Google OAuth Callback Fragility (P1-5)

## 1. Problem Statement
The current Google OAuth callback implementation at `frontend/src/app/api/auth/callback/google/page.tsx` is fragile:
- **Hydration Race Condition**: The page reads `accessToken` from `useAuthStore()`. However, `useAuthStore` starts with `accessToken = null` and `isHydrated = false` before hydration completes. The component immediately redirects to the login page on first render, preempting the store's hydration process and forcing authenticated users to log in again.
- **Incomplete Token Validation**: The check for the access token only tests truthiness (`!accessToken`), which could fail to catch empty strings or whitespace-only tokens.
- **Lack of Error Details**: If a user is redirected, they are sent to the login page without any feedback or query parameters explaining why the flow failed.

## 2. Proposed Changes
- Update `frontend/src/app/api/auth/callback/google/page.tsx`:
  - Extract `isHydrated` and `hydrate` from `useAuthStore`.
  - Invoke `hydrate()` on mount if `useAuthStore` has not yet hydrated.
  - Return early from the exchange `useEffect` while `isHydrated` is false.
  - Robustly check the access token:
    ```typescript
    const token = typeof accessToken === 'string' ? accessToken.trim() : '';
    if (!token) {
      router.replace(`/${locale}/login?error=session_expired`);
      return;
    }
    ```
  - Correct the dependency array of the main `useEffect` to include `isHydrated`.

## 3. Verification Plan
- Build and typecheck the frontend workspace to verify compilation is successful:
  - Run `npm run build` or `npx tsc` on the frontend codebase.
- Check git status and differences to ensure the modifications are correct and surgical.

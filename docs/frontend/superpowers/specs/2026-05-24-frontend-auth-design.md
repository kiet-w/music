# Design Spec - Frontend Auth Implementation (Tasks 5, 6, 7)

## Overview
Implement authentication persistence, route protection, and layout integration for the music player frontend.

## 1. Auth Store (`src/store/useAuthStore.ts`)
- **State**:
  - `user: AuthUser | null`
  - `accessToken: string | null`
  - `isHydrated: boolean` (initially false)
- **Methods**:
  - `setSession(token, user)`: Updates store and `localStorage`.
  - `clearSession()`: Clears store and `localStorage`.
  - `hydrate()`: 
    1. Reads from `localStorage` (`music.auth`).
    2. If token exists, calls `fetchMe(token)` to validate.
    3. On success, updates user; on failure, clears session.
    4. Sets `isHydrated = true`.

## 2. Auth Gate (`src/components/auth/AuthGate.tsx`)
- **Purpose**: Centralized route protection and auth state initialization.
- **Behavior**:
  - Calls `useAuthStore.hydrate()` on mount.
  - While `!isHydrated`, renders a loading screen (e.g., a simple spinner).
  - Detects "Public Routes" (Login/Register).
  - **Redirect Logic**:
    - If `isHydrated && !accessToken` and route is protected -> Redirect to Login.
    - If `isHydrated && accessToken` and route is public -> Redirect to Home.
  - Otherwise, renders children.

## 3. Layout Integration (`src/app/[locale]/layout.tsx`)
- **Structure**:
  - Wrap content with `AuthGate`.
  - Use a sub-component or logic within layout to conditionally render `PlayerBar` and `BottomTabBar`.
  - **Condition**: Hide these components if the current pathname is `/login` or `/register`.

## Success Criteria
- Users are redirected to login if they try to access `/` without a session.
- Users are redirected to `/` if they are logged in and try to access `/login`.
- Session persists across page refreshes (handled by `hydrate`).
- Navigation elements are hidden on auth pages.

# Frontend Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement auth state management, route protection, and layout integration for the music player.

**Architecture:** Use Zustand for auth state, a client-side `AuthGate` component for hydration and redirection, and conditional layout rendering to hide navigation on auth pages.

**Tech Stack:** Next.js, Zustand, `localStorage`, `api.ts`.

---

### Task 1: Create Auth Store

**Files:**
- Create: `src/store/useAuthStore.ts`

- [ ] **Step 1: Implement the auth store with Zustand**

```typescript
import { create } from 'zustand';
import { AuthUser, fetchMe } from '@/lib/api';

type AuthState = {
  user: AuthUser | null;
  accessToken: string | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (accessToken: string, user: AuthUser) => void;
  clearSession: () => void;
};

const AUTH_STORAGE_KEY = 'music.auth';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isHydrated: false,

  setSession: (accessToken, user) => {
    set({ accessToken, user });
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ accessToken, user }));
  },

  clearSession: () => {
    set({ user: null, accessToken: null });
    localStorage.removeItem(AUTH_STORAGE_KEY);
  },

  hydrate: async () => {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) {
      set({ isHydrated: true });
      return;
    }

    try {
      const { accessToken } = JSON.parse(stored);
      if (!accessToken) {
        set({ isHydrated: true });
        return;
      }

      const user = await fetchMe(accessToken);
      set({ accessToken, user, isHydrated: true });
    } catch (error) {
      console.error('Failed to hydrate auth:', error);
      get().clearSession();
      set({ isHydrated: true });
    }
  },
}));
```

- [ ] **Step 2: Verify compilation**
Run: `npm run lint` (or just check if it compiles in the background)

---

### Task 2: Create Auth Gate Component

**Files:**
- Create: `src/components/auth/AuthGate.tsx`

- [ ] **Step 1: Create the AuthGate component**

```tsx
'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { accessToken, isHydrated, hydrate } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;

    // Check for locale prefix (e.g., /vi/login, /en/login)
    const segments = pathname.split('/');
    const isPublicRoute = segments.length >= 3 && (segments[2] === 'login' || segments[2] === 'register');

    if (!accessToken && !isPublicRoute) {
      // Get the locale from the first segment
      const locale = segments[1] || 'en';
      router.replace(`/${locale}/login`);
    } else if (accessToken && isPublicRoute) {
      const locale = segments[1] || 'en';
      router.replace(`/${locale}`);
    }
  }, [accessToken, isHydrated, pathname, router]);

  if (!isHydrated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Initializing...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
```

---

### Task 3: Wrap Layout and Handle Navigation Visibility

**Files:**
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Update the layout to use AuthGate and conditional navigation**

```tsx
import { AuthGate } from '@/components/auth/AuthGate';
// ... existing imports

// We need to use a client component wrapper or just check the pathname in a subcomponent
// Since layout.tsx can be a server component, let's create a ClientLayout wrapper if needed
// or just modify it if it's already a client component or if we can handle it inside children.

// Actually, Task 7 says "Avoid rendering PlayerBar/BottomTabBar on login/register pages".
// I'll create a NavWrapper client component to handle this.
```

- [ ] **Step 2: Create `src/components/auth/NavWrapper.tsx`**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import { PlayerBar } from '@/components/molecules/PlayerBar';
import { BottomTabBar } from '@/components/molecules/Navigation/BottomTabBar';

export function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split('/');
  const isAuthPage = segments.length >= 3 && (segments[2] === 'login' || segments[2] === 'register');

  return (
    <>
      <main className="flex-1 pb-32 overflow-y-auto">
        {children}
      </main>
      {!isAuthPage && (
        <>
          <PlayerBar />
          <BottomTabBar />
        </>
      )}
    </>
  );
}
```

- [ ] **Step 3: Update `src/app/[locale]/layout.tsx`**

```tsx
// ... imports
import { AuthGate } from '@/components/auth/AuthGate';
import { NavWrapper } from '@/components/auth/NavWrapper';

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <AuthGate>
            <div className="flex flex-col h-screen max-w-md mx-auto bg-background shadow-xl overflow-hidden relative border-x">
               <NavWrapper>
                 {children}
               </NavWrapper>
            </div>
          </AuthGate>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

---

### Task 4: Final Verification

- [ ] **Step 1: Run build**
Run: `npm run build`
Expected: Success

- [ ] **Step 2: Verify file existence**
Run: `ls src/store/useAuthStore.ts src/components/auth/AuthGate.tsx src/components/auth/NavWrapper.tsx`

# Hide Google Drive in AlbumDetailClient Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Google Drive import feature from the album detail view.

**Architecture:** Surgical removal of Google Drive hooks, state, and UI components from `AlbumDetailClient.tsx`.

**Tech Stack:** React, TypeScript, Next.js, Lucide Icons.

---

### Task 1: Clean up imports and types

**Files:**
- Modify: `src/components/templates/AlbumDetailClient.tsx`

- [ ] **Step 1: Remove unused imports**

Remove `Upload` from `lucide-react`, `useGoogleDrive` hook, and the dynamic import for `DrivePicker`.

```typescript
// src/components/templates/AlbumDetailClient.tsx

// Remove:
// import { Upload } from 'lucide-react';
// import { useGoogleDrive } from '@/hooks/useGoogleDrive';
// import dynamic from 'next/dynamic';

// const DrivePicker = dynamic(() => import('@/components/google-drive/DrivePicker').then(mod => mod.DrivePicker), {
//   ssr: false,
// });
```

- [ ] **Step 2: Commit**

```bash
git add src/components/templates/AlbumDetailClient.tsx
git commit -m "refactor: remove Google Drive imports in AlbumDetailClient"
```

### Task 2: Remove state and hook usage

**Files:**
- Modify: `src/components/templates/AlbumDetailClient.tsx`

- [ ] **Step 1: Remove `useGoogleDrive` and state**

Remove the `useGoogleDrive` hook call and the `isDrivePickerOpen` state.

```typescript
// src/components/templates/AlbumDetailClient.tsx

// Remove:
// const { login, listFiles, accessToken: googleToken, files, isLoading: isDriveLoading } = useGoogleDrive();
// const [isDrivePickerOpen, setIsDrivePickerOpen] = useState(false);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/templates/AlbumDetailClient.tsx
git commit -m "refactor: remove Google Drive state and hook usage in AlbumDetailClient"
```

### Task 3: Remove logic and effects

**Files:**
- Modify: `src/components/templates/AlbumDetailClient.tsx`

- [ ] **Step 1: Remove `useEffect` for Google Drive**

Remove the effect that triggers `listFiles`.

```typescript
// src/components/templates/AlbumDetailClient.tsx

// Remove:
// useEffect(() => {
//   if (googleToken && appToken) {
//     listFiles(appToken, googleToken);
//     setIsDrivePickerOpen(true);
//   }
// }, [googleToken, appToken, listFiles]);
```

- [ ] **Step 2: Remove `handleImportClick` handler**

Remove the function that initiates the Drive login/import flow.

```typescript
// src/components/templates/AlbumDetailClient.tsx

// Remove:
// const handleImportClick = () => {
//   if (!appToken) {
//     clearSession();
//     router.push(`/${locale}/login`);
//     return;
//   }
//
//   if (!googleToken) {
//     login();
//   } else {
//     listFiles(appToken, googleToken);
//     setIsDrivePickerOpen(true);
//   }
// };
```

- [ ] **Step 3: Commit**

```bash
git add src/components/templates/AlbumDetailClient.tsx
git commit -m "refactor: remove Google Drive logic in AlbumDetailClient"
```

### Task 4: Remove UI elements

**Files:**
- Modify: `src/components/templates/AlbumDetailClient.tsx`

- [ ] **Step 1: Remove the "Import từ Drive" button**

Remove the `Button` component that calls `handleImportClick`.

```tsx
// src/components/templates/AlbumDetailClient.tsx

// Remove:
// <Button 
//   variant="outline" 
//   size="sm" 
//   onClick={handleImportClick}
//   className="flex items-center gap-2 border-white/10 hover:bg-white/5"
// >
//   <Upload className="w-4 h-4" />
//   <span>Import từ Drive</span>
// </Button>
```

- [ ] **Step 2: Remove `DrivePicker` modal**

Remove the `DrivePicker` component instance from the bottom of the JSX.

```tsx
// src/components/templates/AlbumDetailClient.tsx

// Remove:
// <DrivePicker 
//   isOpen={isDrivePickerOpen}
//   onClose={() => setIsDrivePickerOpen(false)}
//   googleToken={googleToken}
//   files={files}
//   isLoading={isDriveLoading}
//   albumId={id}
//   albums={albums.length > 0 ? albums : [album]}
//   onImportComplete={loadAlbum}
// />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/templates/AlbumDetailClient.tsx
git commit -m "feat: hide Google Drive UI in AlbumDetailClient"
```

### Task 5: Final Verification

- [ ] **Step 1: Run build to ensure no errors**

Run: `npm run build` in the frontend directory.

- [ ] **Step 2: Verify code cleanliness**

Check that no `googleToken`, `DrivePicker`, or `useGoogleDrive` references remain in the file.

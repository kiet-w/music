# Playlist Management & Addition Feedback Implementation Plan

**Goal:** Implement a visually striking demo of playlists and a high-fidelity "Music Addition" flow to provide immediate, satisfying feedback when users add songs.

**Architecture:** Use Framer Motion for magnetic micro-interactions and smooth state transitions. Follow the "Design Taste" guidelines (Asymmetry, high-end Sans-Serif, desaturated accents).

**Tech Stack:** React, Next.js, Tailwind CSS, Framer Motion, Lucide React, Zustand.

---

### Task 1: Create Playlist Molecule & Demo Data

**Files:**
- Create: `src/components/molecules/Playlist/PlaylistCard.tsx`
- Create: `src/components/molecules/Playlist/PlaylistGrid.tsx`

- [ ] **Step 1: Implement PlaylistCard with "Liquid Glass" effect**
Use `backdrop-blur` with a 1px inner border and subtle tinted shadow. Add a magnetic hover effect using Framer Motion.

- [ ] **Step 2: Implement PlaylistGrid**
An asymmetric grid layout (Bento-style or Masonry) for the home page.

---

### Task 2: Implement "Add to Playlist" Interaction

**Files:**
- Create: `src/components/molecules/AddToPlaylist/AddToPlaylistDialog.tsx`
- Modify: `src/components/molecules/Library/Library.tsx`

- [ ] **Step 1: Create a satisfying "Add" animation**
When a song is added, show a micro-animation (e.g., a small "plus" icon morphing into a checkmark with spring physics).

- [ ] **Step 2: Create a selection dialog**
A minimal, premium dialog to choose which playlist to add the song to.

---

### Task 3: Enhance Downloader with Progress & Feedback

**Files:**
- Modify: `src/components/molecules/Downloader/Downloader.tsx`

- [ ] **Step 1: Add a "Processing" visual state**
Use a shimmering skeleton loader or a smooth progress bar while the backend converts the video.

- [ ] **Step 2: "Success" Toast/Notification**
A non-intrusive but clear notification that the song has been added to the library/playlist.

---

### Task 4: Integrate into Home Page

**Files:**
- Modify: `src/app/[locale]/page.tsx`

- [ ] **Step 1: Add "Your Playlists" section**
Insert the `PlaylistGrid` above the Library.

- [ ] **Step 2: Update Layout for Viewport Stability**
Ensure `min-h-[100dvh]` and proper spacing.

---

### Task 5: Verification

- [ ] **Step 1: Verify Framer Motion performance**
Ensure no re-renders are triggered by perpetual animations.
- [ ] **Step 2: Build Check**
Run `npm run build` to ensure type safety and no broken imports.

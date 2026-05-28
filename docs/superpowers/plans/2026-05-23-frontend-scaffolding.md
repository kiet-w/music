# Frontend Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a React + Vite frontend with Howler.js for music playback.

**Architecture:** Component-based React app with a central AudioPlayer service.

**Tech Stack:** React, Vite, Howler.js, CSS Modules.

---

### Task 1: React + Vite Project Scaffolding

**Files:**
- Create: `frontend/*`

- [ ] **Step 1: Initialize Vite project**
Run: `npm create vite@latest frontend -- --template react-ts`

- [ ] **Step 2: Install dependencies**
Run: `cd frontend && npm install howler axios`

- [ ] **Step 3: Verify initial build**
Run: `cd frontend && npm run dev` (Check if it starts, then kill)

- [ ] **Step 4: Commit**
```bash
git add frontend
git commit -m "chore: scaffold react frontend with vite"
```

### Task 2: Core Layout and Styling

**Files:**
- Create: `frontend/src/App.css`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Set up basic layout**
Create a mobile-first container with Header, Main (Library), and Footer (Player Bar).

- [ ] **Step 2: Implement Vanilla CSS**
Add basic reset and flexbox/grid layout for a music player look.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/App.tsx frontend/src/App.css
git commit -m "feat: setup basic layout and vanilla css"
```

### Task 3: Audio Player Component (Howler.js)

**Files:**
- Create: `frontend/src/components/Player/Player.tsx`
- Create: `frontend/src/components/Player/Player.css`

- [ ] **Step 1: Create Player Component**
```tsx
import React, { useState, useEffect } from 'react';
import { Howl } from 'howler';

export const Player = ({ url }: { url: string }) => {
  // Use Howl to load and play audio from URL
  // State for play/pause, seek, volume
  return (
    <div className="player">
       {/* UI for play/pause, progress bar */}
    </div>
  );
};
```

- [ ] **Step 2: Verify with mock URL**
Manual check: Pass a direct mp3 link to verify playback.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components/Player
git commit -m "feat: add audio player component using howler.js"
```

### Task 4: Library and Downloader Components

**Files:**
- Create: `frontend/src/components/Library/Library.tsx`
- Create: `frontend/src/components/Downloader/Downloader.tsx`

- [ ] **Step 1: Implement Library View**
List songs fetched from backend API.

- [ ] **Step 2: Implement Downloader Input**
Input field for URL with a "Download" button that hits backend `/download`.

- [ ] **Step 3: Commit**
```bash
git add frontend/src/components
git commit -m "feat: add library and downloader components"
```

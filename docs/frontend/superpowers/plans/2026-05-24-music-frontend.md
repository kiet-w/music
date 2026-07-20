# Music Frontend Implementation Plan (Shadcn + Atoms + i18n)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a professional Next.js 14 frontend using Shadcn UI, Atomic Design, and i18n.

**Architecture:** Next.js App Router, Atomic Design (src/components/atoms), next-intl for i18n, and standard Skeletons for loading states.

**Tech Stack:** Next.js 14, Shadcn UI, next-intl, Zustand, Howler.js, Capacitor.

---

### Task 1: Migration & Multi-language Setup
**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/messages/vi.json`
- Create: `frontend/messages/en.json`
- Create: `frontend/src/i18n.ts`

- [ ] **Step 1: Install i18n and Atomic dependencies**
```json
{
  "dependencies": {
    "next-intl": "latest",
    "lucide-react": "^0.344.0"
  }
}
```
- [ ] **Step 2: Configure i18n Middleware and Root Layout**
- [ ] **Step 3: Setup Atomic structure (`src/components/atoms`, `src/components/molecules`)**
- [ ] **Step 4: Commit i18n setup**

### Task 2: Shadcn & Atoms Integration
- [ ] **Step 1: Initialize Shadcn UI**
- [ ] **Step 2: Map Shadcn components to Atoms folder**
- [ ] **Step 3: Build Custom Skeleton Atoms for Albums and Tracks**
- [ ] **Step 4: Commit components**

### Task 3: Core Pages & Skeletons
- [ ] **Step 1: Home Page (`page.tsx`) + Loading Skeleton (`loading.tsx`)**
- [ ] **Step 2: Album Detail (`page.tsx`) + Loading Skeleton (`loading.tsx`)**
- [ ] **Step 3: Implement internationalized text for all UI elements**
- [ ] **Step 4: Commit pages**

### Task 4: Player & Capacitor
- [ ] **Step 1: Player Bar Atom/Molecule**
- [ ] **Step 2: Capacitor Sync**
- [ ] **Step 3: Commit final frontend build**

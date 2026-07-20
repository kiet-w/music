# Sync Core Shell and Auth Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify Login and Register templates with a centered card layout and ensure correct positioning and z-indexing for the PlayerBar and BottomTabBar.

**Architecture:** 
- Centralize auth UI patterns into standardized card-based layouts.
- Adjust `AuthGate` to better manage content wrapping if necessary.
- Ensure fixed bottom components use consistent spacing and z-indexes for proper layering.

**Tech Stack:** React, Next.js, Tailwind CSS, shadcn/ui.

---

### Task 1: Unify Login Template

**Files:**
- Modify: `src/components/templates/LoginTemplate.tsx`

- [ ] **Step 1: Update LoginTemplate to use centered card layout**
- Use `min-h-dvh flex items-center justify-center` for the main container.
- Use `Card` from `@/components/atoms/ui/card`.
- Set `max-w-[400px]` for the card.
- Standardize the header, music icon, and form fields.

### Task 2: Unify Register Template

**Files:**
- Modify: `src/components/templates/RegisterTemplate.tsx`

- [ ] **Step 1: Update RegisterTemplate to match LoginTemplate's new style**
- Use `min-h-dvh flex items-center justify-center` for the main container.
- Use `Card` with `max-w-[400px]`.
- Match the visual style (icons, spacing, button height) with `LoginTemplate`.

### Task 3: Refine AuthGate wrapping

**Files:**
- Modify: `src/components/auth/AuthGate.tsx`

- [ ] **Step 1: Check and update wrapping**
- Ensure `AuthGate` doesn't conflict with the centered layout of auth pages.
- Currently, `layout.tsx` wraps children with a `div` that has `pb-32`. This might need to be conditional.

### Task 4: Fix Bottom Bar Spacing and Z-Index

**Files:**
- Modify: `src/components/molecules/PlayerBar.tsx`
- Modify: `src/components/molecules/Navigation/BottomTabBar.tsx`
- Modify: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Standardize Z-Indexes**
- Set `BottomTabBar` to `z-50`.
- Set `PlayerBar` to `z-40`.
- [ ] **Step 2: Adjust Spacing**
- Ensure `PlayerBar` is positioned correctly above `BottomTabBar`.
- If `BottomTabBar` height is ~80px (64+16), `bottom-[88px]` or `bottom-[96px]` for `PlayerBar` is reasonable.
- [ ] **Step 3: Update Layout Container**
- Make the `pb-32` padding in `layout.tsx` conditional or adjust it based on whether the nav is present.

### Task 5: Verification

- [ ] **Step 1: Verify Login Page UI**
- [ ] **Step 2: Verify Register Page UI**
- [ ] **Step 3: Verify PlayerBar and BottomTabBar overlap/spacing**
- [ ] **Step 4: Verify AuthGate redirection**

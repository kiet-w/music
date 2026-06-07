# AuthService Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `AuthService` to improve maintainability and follow SRP by extracting private helper methods.

**Architecture:** Extraction of concerns into private helpers:
1. `buildAuthResponse`: Handles JWT signing and response formatting.
2. `verifyGoogleToken`: Handles external Google API interaction.
3. `findOrCreateGoogleUser`: Handles database logic for Google users (find, link, or create).

**Tech Stack:** NestJS, Prisma, JWT, Google Auth Library.

---

### Task 1: Refactor AuthService

**Files:**
- Modify: `backend/src/auth/auth.service.ts`

- [ ] **Step 1: Apply the refactored code**

Replace the entire content of `backend/src/auth/auth.service.ts` with the optimized version.

- [ ] **Step 2: Verify imports and types**

Ensure `@prisma/client` is correctly imported and `User` type is used in private methods.

- [ ] **Step 3: Run existing tests**

Run: `npm run test` and `npm run test:e2e` in the `backend` directory to ensure no regressions.
Expected: All tests pass.

- [ ] **Step 4: Commit changes**

```bash
git add backend/src/auth/auth.service.ts
git commit -m "refactor(auth): extract private helpers for better SRP in AuthService"
```

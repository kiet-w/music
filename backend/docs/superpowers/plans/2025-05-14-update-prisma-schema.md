# BE-1: Update Prisma Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the `User` model in `prisma/schema.prisma` to support Google Login by making `passwordHash` optional and adding a unique `googleId` field.

**Architecture:** Update Prisma schema and use Prisma Migrate to apply changes to the database.

**Tech Stack:** Prisma, PostgreSQL

---

### Task 1: Update Schema

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Modify User model**

Change `passwordHash` to optional and add `googleId` as an optional unique field.

```prisma
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String?
  googleId     String?  @unique
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  albums       Album[]
}
```

### Task 2: Generate and Apply Migration

**Files:**
- Create: `backend/prisma/migrations/*/migration.sql`

- [ ] **Step 1: Run migration command**

Run: `npx prisma migrate dev --name add_google_id` in `backend/` directory.

Expected: Migration created and applied successfully.

- [ ] **Step 2: Verify migration file content**

Check the latest migration file in `backend/prisma/migrations/` to ensure it correctly alters the `passwordHash` column and adds the `googleId` column with a unique index.

### Task 3: Final Verification

- [ ] **Step 1: Validate Prisma schema**

Run: `npx prisma validate` in `backend/` directory.
Expected: The schema is valid.

- [ ] **Step 2: Run verification before completion**

Ensure all steps are complete and verified with fresh evidence.

---
name: granular-split-planning
description: Automated granular planning with split files for Backend, Frontend, and Integration. Trigger this skill when starting any new feature, bug fix, or complex modification that requires a structured roadmap. It ensures tasks are broken down into small, verifiable units and organized into separate domain-specific files in docs/plan/.
---

# Granular Split Planning

This skill guides the creation of highly detailed, split-domain implementation plans. It ensures that Backend, Frontend, and Integration tasks are clearly separated and broken down into small, manageable steps.

## Workflow

### 1. Requirements Analysis & Brainstorming
- Deeply understand the user's request.
- Identify all affected components (Database, API, UI, State, etc.).
- Use the `brainstorming` skill if needed to clarify ambiguity.

### 2. Task Granularity (The "Small Task" Rule)
- Every task must be "surgical": aiming for 5-10 lines of code per task where possible.
- Each task MUST have a clear **Verification** step (e.g., "Run test X", "Check log Y", "Inspect UI Z").
- Avoid vague tasks like "Implement feature X". Instead, use "Create DTO for X", "Add validation for Y", "Build component Z".

### 3. Split Planning (Three-File Architecture)
Once the plan is finalized, write it into exactly three files in the `docs/plan/` directory (create the directory if it doesn't exist). Use a consistent slug for the `[task-name]`.

#### File A: Backend Plan
- **Path:** `docs/plan/backend_[task-name].md`
- **Focus:** Database migrations, Prisma schemas, NestJS services, Controllers, DTOs, logic, and Unit/E2E tests for the backend.

#### File B: Frontend Plan
- **Path:** `docs/plan/frontend_[task-name].md`
- **Focus:** UI components, React hooks, Zustand stores, styling, internationalization (i18n), and frontend unit tests.

#### File C: Integration Plan (BE & FE)
- **Path:** `docs/plan/be&fe_[task-name].md`
- **Focus:** API contracts (Request/Response shapes), Realtime subscriptions (Supabase), Authentication flow between tiers, and end-to-end integration tests.

## Plan Template Structure

Each plan file should follow this structure:

```markdown
# [Domain] Plan: [Feature Name]

## 1. Context & Objectives
Briefly describe what this part of the plan achieves.

## 2. Granular Tasks
- [ ] **Task 1: [Short Title]**
  - **Action:** Exactly what to do.
  - **Verification:** How to prove it's done correctly.
- [ ] **Task 2: [Short Title]**
  - ...
```

## Strategy for Execution
- After creating these files, provide the user with the file paths.
- Execute tasks sequentially, updating the checkboxes in the `.md` files as you progress.
- Never move to the next task until the current one is verified.

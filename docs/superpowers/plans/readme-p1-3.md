# Readme P1-3: Clean up raw python endpoints and dummy user_id references in frontend

## Changes Done

### 1. Centralized Python Service API URL Configuration
- **File**: [frontend/src/lib/api.ts](file:///home/baudui/.gemini/antigravity-cli/brain/d7c0ba4c-7266-435e-ae3d-e179ad210757/.system_generated/worktrees/subagent-P1-3-Host-Port-Hardener-self-53913a28/frontend/src/lib/api.ts)
- **Details**: Added the `PYTHON_API_URL` configuration constant which is parsed from the environment variable `NEXT_PUBLIC_PYTHON_API_URL` and defaults to `http://localhost:8001`. Trailing slashes are stripped for clean endpoint paths.

### 2. Updated YouTube Conversion/Status Workflows
- **File**: [frontend/src/app/[locale]/youtube/page.tsx](file:///home/baudui/.gemini/antigravity-cli/brain/d7c0ba4c-7266-435e-ae3d-e179ad210757/.system_generated/worktrees/subagent-P1-3-Host-Port-Hardener-self-53913a28/frontend/src/app/[locale]/youtube/page.tsx)
- **Details**: 
  - Integrated `PYTHON_API_URL` from `@/lib/api` and `useAuthStore` from `@/store/useAuthStore`.
  - Replaced the hardcoded URLs pointing to `http://localhost:8001/youtube/status/\${jobId}` and `http://localhost:8001/youtube/convert` with dynamic URLs using the centralized `PYTHON_API_URL`.
  - Replaced the hardcoded dummy user ID `00000000-0000-0000-0000-000000000000` with the actual authenticated user's ID (`user.id`) in the request payload.
  - Added an explicit check to confirm the user is logged in (`user?.id`) before triggering the download/conversion.

## Verification
- Checked git diff of all modifications. Both `frontend/src/lib/api.ts` and `frontend/src/app/[locale]/youtube/page.tsx` show surgical and correct changes.

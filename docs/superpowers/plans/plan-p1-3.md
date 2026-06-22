# Plan P1-3: Clean up raw python endpoints and dummy user_id references in frontend

## Objective
Implement task P1-3. Clean up any remaining references to `localhost:8001` / raw python endpoint in the frontend, and resolve/clean up dummy user_id references in frontend download workflows.

## Findings
1. **Hardcoded Ports**:
   - In [frontend/src/app/[locale]/youtube/page.tsx](file:///home/baudui/.gemini/antigravity-cli/brain/d7c0ba4c-7266-435e-ae3d-e179ad210757/.system_generated/worktrees/subagent-P1-3-Host-Port-Hardener-self-53913a28/frontend/src/app/[locale]/youtube/page.tsx), there are two hardcoded fetches to `http://localhost:8001/youtube/status/\${jobId}` and `http://localhost:8001/youtube/convert`.
2. **Dummy User IDs**:
   - In [frontend/src/app/[locale]/youtube/page.tsx](file:///home/baudui/.gemini/antigravity-cli/brain/d7c0ba4c-7266-435e-ae3d-e179ad210757/.system_generated/worktrees/subagent-P1-3-Host-Port-Hardener-self-53913a28/frontend/src/app/[locale]/youtube/page.tsx#L74), the payload for `/youtube/convert` passes a dummy `user_id: '00000000-0000-0000-0000-000000000000'`.

## Plan
1. **Centralize Python Service URL Configuration**:
   - In [frontend/src/lib/api.ts](file:///home/baudui/.gemini/antigravity-cli/brain/d7c0ba4c-7266-435e-ae3d-e179ad210757/.system_generated/worktrees/subagent-P1-3-Host-Port-Hardener-self-53913a28/frontend/src/lib/api.ts), define and export `PYTHON_API_URL` based on the environment variable `NEXT_PUBLIC_PYTHON_API_URL`, defaulting to `http://localhost:8001`.
2. **Clean up page `youtube/page.tsx`**:
   - Import `useAuthStore` to access the logged-in user object and its `id`.
   - Retrieve `PYTHON_API_URL` from `@/lib/api`.
   - Replace the hardcoded `http://localhost:8001` URLs with `PYTHON_API_URL`.
   - Ensure the post request to `\${PYTHON_API_URL}/youtube/convert` uses the authenticated user's ID (`user.id`).
   - Add a check to confirm the user is logged in before allowing them to trigger a download/convert.
3. **Verify and Test**:
   - Verify frontend builds correctly.
   - Commit and push changes.

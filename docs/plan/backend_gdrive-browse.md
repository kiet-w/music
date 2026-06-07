# Backend Plan: Google Drive Browse Implementation

## 1. Context & Objectives
Implement backend support for Google Drive browsing and importing. This includes checking if a user's Google account is linked and handling file imports with optional custom filenames and temporary drive tokens.

## 2. Granular Tasks
- [ ] **Task 1: Add `getGoogleStatus` to `AuthService`**
  - **Action:** Add `async getGoogleStatus(userId: string): Promise<{ linked: boolean; email?: string }>` to `backend/src/auth/auth.service.ts`.
  - **Verification:** Create a unit test in `backend/src/auth/auth.service.spec.ts` that mocks `UserRepository.findUnique` and verifies the returned status.
- [ ] **Task 2: Add `GET /auth/google/status` to `AuthController`**
  - **Action:** Add the endpoint with `JwtAuthGuard`.
  - **Verification:** Run a curl command or use an E2E test to verify the endpoint returns 200 and the correct structure.
- [ ] **Task 3: Update `ImportDto`**
  - **Action:** Add `fileName` and `driveToken` as optional strings to `backend/src/google-drive/dto/import.dto.ts`.
  - **Verification:** Ensure the project still builds.
- [ ] **Task 4: Update `GoogleDriveService` to handle optional tokens**
  - **Action:** Modify `listFiles`, `getFileMetadata`, and `downloadFile` to accept an optional `token: string`.
  - **Action:** Refactor `setCredentials` or create a helper to get an `OAuth2` client for a specific user or token without clobbering the singleton state if possible (or at least handle the `driveToken` case).
  - **Verification:** Unit tests for `GoogleDriveService`.
- [ ] **Task 5: Add `POST /music/import` and update `POST /google-drive/import`**
  - **Action:** Update `GoogleDriveController.importFile` to use `fileName` and `driveToken` from the DTO.
  - **Action:** Create `backend/src/google-drive/music.controller.ts` with `@Controller('music')` and a `@Post('import')` method that delegates to the same logic.
  - **Verification:** Verify both `/google-drive/import` and `/music/import` work as expected.

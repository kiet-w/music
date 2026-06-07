# Integration Plan: Google Drive Browse

## 1. Context & Objectives
Ensure the frontend and backend correctly communicate for Google Drive features, specifically the link status and import functionality.

## 2. API Contracts
### GET /auth/google/status
- **Request:** Header `Authorization: Bearer <jwt>`
- **Response:**
  ```json
  {
    "linked": boolean,
    "email": string (optional)
  }
  ```

### POST /music/import (or /google-drive/import)
- **Request Body:**
  ```json
  {
    "fileId": "string",
    "albumId": "string (optional)",
    "fileName": "string (optional)",
    "driveToken": "string (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "id": "string",
    "title": "string",
    "url": "string",
    "albumId": "string",
    "sourceType": "google-drive",
    "sourceId": "string"
  }
  ```

## 3. Granular Tasks
- [ ] **Task 1: Verify `GET /auth/google/status`**
  - **Action:** Test the endpoint with a linked and an unlinked user.
  - **Verification:** Correct `linked` status and `email` returned.
- [ ] **Task 2: Verify `POST /music/import` with `driveToken`**
  - **Action:** Mock a Google Drive download using a provided `driveToken`.
  - **Verification:** File is successfully imported and stored.
- [ ] **Task 3: Verify `POST /music/import` with custom `fileName`**
  - **Action:** Import a file and specify a different `fileName`.
  - **Verification:** The created track has the specified `fileName` as title.

# Design Spec - Google Drive Import

This document outlines the design for importing audio files (.mp3, .flac, .wav) directly from Google Drive into the Music App.

## 1. Problem Statement
Users want to import their existing music library from Google Drive into the app without having to download and re-upload files manually. The app needs a mobile-friendly way to browse and select files from Drive.

## 2. Proposed Solution
A frontend-driven integration where the client handles authentication and file selection, and the backend handles the secure transfer of files from Google Drive to Supabase Storage.

### 2.1 Key Features
- **Frontend Authentication:** Use Google OAuth2 on the client to get an access token.
- **Custom File Picker:** A responsive UI within the app to list and search for audio files in the user's Drive.
- **Streamed Import:** Backend fetches the file stream from Google Drive and pipes it directly to Supabase Storage.
- **Progress Tracking:** Real-time feedback for the user during the import process.

## 3. Architecture

### 3.1 Backend (NestJS)
- **`GoogleDriveService` Extension:**
  - Method `downloadAndUpload(fileId: string, accessToken: string, albumId: string)`:
    - Fetches the file stream using `drive.files.get`.
    - Retrieves metadata (filename, size).
    - Pipes the stream to `StorageService.uploadStream`.
- **`StorageService` Extension:**
  - Support for streaming uploads to Supabase to avoid memory overhead.
- **`SongService` Integration:**
  - After successful upload, create a `Song` record in the database linked to the `Album`.

### 3.2 Frontend (React + Capacitor)
- **Google Auth:** Integration using a library like `@react-oauth/google` (web) or Capacitor Google Auth plugin (mobile).
- **Google Drive Modal:**
  - State management for folder navigation and file selection.
  - Search functionality.
  - Filtering for `mimeType` (audio/*).
- **Import Manager:**
  - Queue management for importing multiple files.
  - UI indicators for "Pending", "Importing", "Completed".

### 3.3 Data Flow
1. User clicks "Import from Drive".
2. Frontend triggers Google Sign-In.
3. Frontend uses `accessToken` to call Backend `google-drive/files` (to list).
4. User selects files and clicks "Import".
5. Frontend calls Backend `google-drive/import` with `fileIds` and `accessToken`.
6. Backend streams each file: Google Drive -> NestJS -> Supabase Storage.
7. Backend updates DB.
8. Frontend refreshes the Album view via Supabase Realtime.

## 4. UI/UX Design
- **Entry Point:** A new "Google Drive" option in the existing Import menu.
- **Picker UI:**
  - List view with file names, sizes, and icons.
  - Checkboxes for multi-select.
  - "Import X files" primary action button.
- **Mobile Considerations:** Ensure the modal is full-screen or bottom-sheet style on small screens.

## 5. Security & Constraints
- **Access Tokens:** Never stored in the database. Only passed in-memory during the session.
- **Cleanup:** Backend ensures no partial files are left in Storage if an import fails.
- **Rate Limiting:** Handle Google API quotas gracefully.

## 6. Implementation Plan (High-Level)
1. **Phase 1 (Backend):** Implement stream-to-storage logic.
2. **Phase 2 (Frontend):** Implement Google Auth and basic file list.
3. **Phase 3 (Frontend):** Build the Picker UI and multi-select logic.
4. **Phase 4 (Integration):** Connect everything and add progress feedback.

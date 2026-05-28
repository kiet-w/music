# Google Drive Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a feature to import .mp3, .flac, and .wav files from Google Drive into the application's albums.

**Architecture:** Frontend handles Google OAuth2 and file selection via a custom picker. Backend receives the `accessToken` and `fileId`, downloads the file from Drive, and uploads it to Supabase Storage.

**Tech Stack:** NestJS, googleapis, Supabase, React, Lucide React, Tailwind CSS.

---

### Task 1: Backend Storage Service Extension

**Files:**
- Modify: `backend/src/storage/storage.service.ts`

- [ ] **Step 1: Add `uploadBuffer` method to `StorageService`**
The current `upload` method reads from disk. We need a method that accepts a Buffer for direct streaming from Google Drive.

```typescript
// backend/src/storage/storage.service.ts
async uploadBuffer(
  buffer: Buffer,
  bucketName: string,
  destinationPath: string,
  contentType: string = 'audio/mpeg',
): Promise<string> {
  const { data, error } = await this.supabase.storage
    .from(bucketName)
    .upload(destinationPath, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new InternalServerErrorException(`Supabase upload failed: ${error.message}`);
  }
  return data.path;
}
```

- [ ] **Step 2: Verify with a mock call (manual or unit test)**
- [ ] **Step 3: Commit**

### Task 2: Backend Google Drive Service Extension

**Files:**
- Modify: `backend/src/google-drive/google-drive.service.ts`

- [ ] **Step 1: Implement `getFile` and `downloadFile` methods**

```typescript
// backend/src/google-drive/google-drive.service.ts
async getFileMetadata(accessToken: string, fileId: string) {
  this.oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  const res = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size',
  });
  return res.data;
}

async downloadFile(accessToken: string, fileId: string): Promise<Buffer> {
  this.oauth2Client.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );
  return Buffer.from(res.data as ArrayBuffer);
}
```

- [ ] **Step 2: Commit**

### Task 3: Backend Import Endpoint

**Files:**
- Modify: `backend/src/google-drive/google-drive.controller.ts`
- Modify: `backend/src/google-drive/google-drive.module.ts`
- Modify: `backend/src/songs/songs.module.ts` (export SongRepository)

- [ ] **Step 1: Create `ImportDto`**
- [ ] **Step 2: Implement `POST /google-drive/import`**

```typescript
// Controller logic
@Post('import')
async importFile(@Body() body: { fileId: string; accessToken: string; albumId: string }) {
  const { fileId, accessToken, albumId } = body;
  const metadata = await this.googleDriveService.getFileMetadata(accessToken, fileId);
  const buffer = await this.googleDriveService.downloadFile(accessToken, fileId);
  
  const storagePath = `songs/${albumId}/${metadata.name}`;
  const path = await this.storageService.uploadBuffer(buffer, 'music', storagePath, metadata.mimeType);
  const url = await this.storageService.getPublicUrl('music', path);

  return this.songRepository.create({
    data: {
      title: metadata.name.replace(/\.[^/.]+$/, ""),
      artist: 'Unknown Artist',
      url,
      albumId,
      sourceType: 'google-drive',
    }
  });
}
```

- [ ] **Step 3: Commit**

### Task 4: Frontend Google Auth Integration

**Files:**
- Create: `frontend/src/hooks/useGoogleDrive.ts`
- Modify: `frontend/src/app/[locale]/layout.tsx` (Add script tag for Google GIS)

- [ ] **Step 1: Add Google Identity Services script**
- [ ] **Step 2: Create a hook to handle Auth and File Listing**

### Task 5: Frontend Google Drive Picker UI

**Files:**
- Create: `frontend/src/components/google-drive/DrivePicker.tsx`

- [ ] **Step 1: Build the Modal UI**
- [ ] **Step 2: Implement file listing with search and selection**
- [ ] **Step 3: Add "Import" button that calls the backend for each selected file**

### Task 6: Frontend Integration in Albums Page

**Files:**
- Modify: `frontend/src/app/[locale]/albums/page.tsx`

- [ ] **Step 1: Update the "Import" button to open the Drive Picker**
- [ ] **Step 2: Handle success/error notifications**
- [ ] **Step 3: Final verification of the full flow**

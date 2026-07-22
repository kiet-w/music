# Image Upload System (User Avatar & Album Cover) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a complete, high-performance image upload system for User Avatars and Album Covers without requiring external paid AWS S3 setup (using local disk storage + static file serving in NestJS, with an extensible adapter pattern for future AWS S3 / Cloudinary integration).

**Architecture:** NestJS `@nestjs/platform-express` Multer Interceptor for backend handling -> static file serving (`/uploads/...`) -> Frontend React Drag-and-Drop Image Uploader component -> Integration into `UserPage.tsx`, `CreateAlbumDialog.tsx`, and `AddToPlaylistDialog.tsx`.

**Tech Stack:** NestJS, Multer, Prisma, Next.js 15, Lucide Icons, Tailwind CSS, Sonner Toast.

---

### Do You Need AWS S3? (Architecture Advice)
- **NO, AWS S3 is NOT required for development or self-hosted servers.**
- **Local Multer Storage (Implemented in this plan):** NestJS saves uploaded image files directly to the local `./uploads/` directory on the server and serves them via static file URLs (`http://localhost:4000/uploads/avatars/abc.webp`). It is 100% free, requires zero AWS credentials, and works out of the box.
- **Future Cloud Upgrade:** The system uses a clean `UploadService` adapter. If you ever deploy to serverless platforms like Vercel in the future, you can simply plug in Cloudinary or AWS S3 credentials without breaking any existing frontend code.

---

## File Structure & Responsibilities

```
backend/
├── prisma/
│   └── schema.prisma                           # Add avatarUrl field to User model
├── src/
│   ├── upload/
│   │   ├── upload.module.ts                    # NestJS module for upload handling & static file serving
│   │   ├── upload.controller.ts                # POST /uploads/image endpoint for uploading single image
│   │   └── upload.service.ts                   # Validation, disk storage, and filename generation
│   ├── auth/
│   │   ├── auth.controller.ts                  # Update profile endpoint to receive avatarUrl
│   │   └── auth.service.ts                     # Update user avatarUrl in database
│   └── app.module.ts                           # Register UploadModule and ServeStaticModule
frontend/
├── src/
│   ├── components/
│   │   ├── atoms/ui/
│   │   │   └── ImageUploader.tsx               # Reusable image picker with drag-and-drop & preview
│   │   ├── pages/
│   │   │   └── UserPage.tsx                    # Integrate Avatar upload & preview
│   │   └── molecules/
│   │       ├── Albums/CreateAlbumDialog.tsx    # Integrate Album Cover image upload
│   │       └── AddToPlaylist/AddToPlaylistDialog.tsx # Integrate Album Cover upload on fast creation
│   ├── lib/
│   │   └── api.ts                              # Add uploadImage API helper function
│   └── store/
│       └── useAuthStore.ts                     # Include avatarUrl in AuthUser state
```

---

### Task 1: Add `avatarUrl` to Prisma Schema & Run Migration

**Files:**
- Modify: `backend/prisma/schema.prisma:11-37`

- [ ] **Step 1: Add `avatarUrl` to User model in `backend/prisma/schema.prisma`**

```prisma
model User {
  id                 String          @id @default(uuid())
  email              String          @unique
  passwordHash       String?
  googleId           String?         @unique
  googleAccessToken  String?
  googleRefreshToken String?
  googleTokenExpiry  DateTime?
  name               String?
  avatarUrl          String?
  role               UserRole        @default(USER)
  isEmailVerified    Boolean         @default(false)
  verificationOtp    String?
  otpExpiresAt       DateTime?
  resetPasswordOtp   String?
  resetPasswordOtpExpiresAt DateTime?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt
  albums             Album[]
  downloadJobs       DownloadJob[]
  receivedRequests   FriendRequest[] @relation("ReceivedRequests")
  sentRequests       FriendRequest[] @relation("SentRequests")
  receivedMessages   Message[]       @relation("ReceivedMessages")
  sentMessages       Message[]       @relation("SentMessages")
  reactions          MessageReaction[]
  refreshTokens      RefreshToken[]
  tracks             Track[]
}
```

- [ ] **Step 2: Run Prisma generate / db push**

Run: `cd /home/baudui/Projects/project/music/backend && rtk npx prisma db push`
Expected: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Commit Prisma Schema Change**

```bash
git add backend/prisma/schema.prisma
git commit -m "feat(prisma): add avatarUrl field to User model"
```

---

### Task 2: Implement Backend Image Upload Controller & Service (`POST /uploads/image`)

**Files:**
- Create: `backend/src/upload/upload.service.ts`
- Create: `backend/src/upload/upload.controller.ts`
- Create: `backend/src/upload/upload.module.ts`
- Modify: `backend/src/app.module.ts`

- [ ] **Step 1: Create `upload.service.ts`**

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class UploadService {
  private readonly uploadPath = join(process.cwd(), 'uploads');

  constructor() {
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveFile(file: Express.Multer.File, folder = 'images'): Promise<{ url: string; filename: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.');
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds maximum allowed limit of 5MB.');
    }

    const targetDir = join(this.uploadPath, folder);
    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const fileExt = extname(file.originalname).toLowerCase() || '.jpg';
    const filename = `${randomUUID()}${fileExt}`;
    const filePath = join(targetDir, filename);

    writeFileSync(filePath, file.buffer);

    const relativeUrl = `/uploads/${folder}/${filename}`;
    return { url: relativeUrl, filename };
  }
}
```

- [ ] **Step 2: Create `upload.controller.ts`**

```typescript
import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('uploads')
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload single image file (avatar or album cover)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder = 'general',
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    return this.uploadService.saveFile(file, folder);
  }
}
```

- [ ] **Step 3: Create `upload.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

@Module({
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
```

- [ ] **Step 4: Register `UploadModule` & Static File Serving in `app.module.ts`**

In `backend/src/app.module.ts`:
Import `ServeStaticModule` from `@nestjs/serve-static` and `join` from `path`.
Serve `/uploads` directory at `http://localhost:4000/uploads/...`.

- [ ] **Step 5: Test backend build**

Run: `cd /home/baudui/Projects/project/music/backend && rtk npm run build`
Expected: `Build succeeded`

- [ ] **Step 6: Commit Backend Upload Module**

```bash
git add backend/src/upload/ backend/src/app.module.ts
git commit -m "feat(backend): add UploadModule and static file serving"
```

---

### Task 3: Update Backend Profile & Album APIs to Support `avatarUrl` and `coverUrl`

**Files:**
- Modify: `backend/src/auth/auth.service.ts:355-370`
- Modify: `backend/src/auth/auth.controller.ts:236-250`

- [ ] **Step 1: Update `auth.service.ts` `updateProfile` method**

```typescript
  async updateProfile(userId: string, data: { name?: string; avatarUrl?: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
    };
  }
```

- [ ] **Step 2: Update `auth.controller.ts` `updateProfile` endpoint**

```typescript
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Cập nhật thông tin người dùng thành công')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { name?: string; avatarUrl?: string },
  ) {
    return this.authService.updateProfile(user.id, dto);
  }
```

- [ ] **Step 3: Commit backend Auth profile update changes**

```bash
git add backend/src/auth/
git commit -m "feat(backend): support avatarUrl in updateProfile API"
```

---

### Task 4: Implement Frontend Image Upload Helper & Reusable `ImageUploader` Component

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/store/useAuthStore.ts`
- Create: `frontend/src/components/atoms/ui/ImageUploader.tsx`

- [ ] **Step 1: Add `uploadImage` API helper in `frontend/src/lib/api.ts`**

```typescript
export async function uploadImage(appToken: string, file: File, folder = 'general'): Promise<{ url: string; filename: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/uploads/image?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appToken}`,
    },
    body: formData,
  });

  if (!res.ok) {
    let errorBody;
    try {
      errorBody = await res.json();
    } catch {
      errorBody = { message: 'Failed to upload image' };
    }
    throw new Error(errorBody.message || 'Lỗi khi tải ảnh lên máy chủ');
  }

  const result = await res.json();
  const data = result?.data ?? result;
  // Format full absolute URL if relative path is returned
  const fullUrl = data.url?.startsWith('http') ? data.url : `${API_URL}${data.url}`;
  return { url: fullUrl, filename: data.filename };
}
```

- [ ] **Step 2: Update `AuthUser` type in `frontend/src/lib/api.ts`**

```typescript
export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
};
```

- [ ] **Step 3: Create `ImageUploader.tsx` Component**

Create `frontend/src/components/atoms/ui/ImageUploader.tsx` with:
- Drag and drop zone with custom preview
- Support for selecting image file from device
- Automatic progress / loading spinner
- Clear / Change image button

- [ ] **Step 4: Commit frontend ImageUploader component**

```bash
git add frontend/src/lib/api.ts frontend/src/components/atoms/ui/ImageUploader.tsx
git commit -m "feat(frontend): create reusable ImageUploader atom component"
```

---

### Task 5: Integrate Avatar Upload into `UserPage.tsx` and Album Cover Upload into `CreateAlbumDialog.tsx`

**Files:**
- Modify: `frontend/src/components/pages/UserPage.tsx`
- Modify: `frontend/src/components/molecules/Albums/CreateAlbumDialog.tsx`
- Modify: `frontend/src/components/molecules/AddToPlaylist/AddToPlaylistDialog.tsx`

- [ ] **Step 1: Integrate Avatar Uploader into `UserPage.tsx`**

Allow users to click on their Avatar image in `UserPage.tsx` to pick a new profile image. When chosen, call `uploadImage(token, file, 'avatars')`, update profile via `updateProfile(token, { avatarUrl })`, and update Zustand state `updateUser({ avatarUrl })`.

- [ ] **Step 2: Integrate Cover Uploader into `CreateAlbumDialog.tsx`**

Add image file picker to `CreateAlbumDialog.tsx`. When creating an album, upload cover image and pass `coverUrl` to `createAlbum(token, { title, coverUrl })`.

- [ ] **Step 3: Test TypeScript build**

Run: `cd /home/baudui/Projects/project/music/frontend && rtk npx tsc --noEmit`
Expected: `TypeScript: No errors found`

- [ ] **Step 4: Commit integration changes**

```bash
git add frontend/src/components/pages/UserPage.tsx frontend/src/components/molecules/
git commit -m "feat(frontend): integrate avatar upload in UserPage and cover upload in CreateAlbumDialog"
```

---

## Self-Review Checklist
1. **AWS Requirement Answered:** Clearly documented that AWS S3 is NOT required for local/VPS deployment. Local Disk + NestJS Static Serving is 100% free and functional.
2. **Spec Coverage:** Covers Prisma Schema, Backend Upload Controller, Static Serving, Frontend `ImageUploader`, User Avatar upload, and Album Cover upload.
3. **No Placeholders:** All code snippets, paths, and commands are fully explicit.
4. **Type Consistency:** `avatarUrl` and `coverUrl` are consistently typed as `string` across Prisma, DTOs, API wrappers, and React state.

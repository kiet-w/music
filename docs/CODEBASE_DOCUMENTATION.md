# Codebase Comprehensive Documentation Hub

Tài liệu này tổng hợp toàn bộ các chi tiết kỹ thuật của hệ thống Music Player, bao gồm cả Backend (NestJS) và Frontend (Next.js).

---

## 1. Backend Documentation (NestJS)
Các tài liệu chi tiết cho từng module backend, nằm tại `backend/backend-docs/`.

- [**Auth Module**](../backend/backend-docs/auth/auth.md): Xác thực, JWT, Google OAuth.
- [**Songs Module**](../backend/backend-docs/features/songs.md): Quản lý bài hát và quy trình tải nhạc.
- [**Albums Module**](../backend/backend-docs/features/albums.md): Phân loại bài hát và quản lý Album.
- [**Downloader Module**](../backend/backend-docs/integrations/downloader.md): Tương tác với `yt-dlp` và `ffmpeg`.
- [**Storage Module**](../backend/backend-docs/integrations/storage.md): Tích hợp Supabase Storage.
- [**Jobs Module**](../backend/backend-docs/integrations/jobs.md): Xử lý hàng đợi BullMQ và Redis.
- [**Google Drive Module**](../backend/backend-docs/integrations/google-drive.md): Browse và Import từ Drive.
- [**Messages Module**](../backend/backend-docs/features/messages.md): Chat và lời mời kết bạn.
- [**Prisma Module**](../backend/backend-docs/core/prisma.md): Cấu hình Database và ORM.
- [**Common Module**](../backend/backend-docs/core/common.md): Base classes, Filters, Interceptors.
- [**Core Module**](../backend/backend-docs/core/core.md): App Module và cấu hình hệ thống.

---

## 2. Frontend Documentation (Next.js)
Các tài liệu chi tiết cho cấu trúc frontend, nằm tại `frontend/frontend-docs/`.

- [**Architecture & Libs**](../frontend/frontend-docs/architecture.md): Stack kỹ thuật và API Client.
- [**State Management**](../frontend/frontend-docs/state-management.md): Chi tiết các Zustand Stores.
- [**Components & UI**](../frontend/frontend-docs/components.md): Atomic Design và shadcn/ui.
- [**Pages & Routing**](../frontend/frontend-docs/pages-routing.md): Cấu trúc App Router và i18n.

---

## 3. Tổng quan Hệ thống
- [**System Design Overview**](./system-design-overview.svg): Sơ đồ kiến trúc tổng thể.
- [**Backend-Frontend Deep Dive**](./backend-frontend-deep-dive.md): Phân tích chi tiết luồng tương tác giữa hai tier.
- [**Database ERD**](./diagrams/architecture/database-erd.svg): Sơ đồ thực thể quan hệ cơ sở dữ liệu.

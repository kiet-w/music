# Music App — Design Specification

## Overview
A modern, minimal, dark-mode music player and downloader.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), Tailwind CSS, Shadcn UI, Howler.js, Capacitor.
- **Backend:** NestJS, Prisma ORM, Supabase.

## Architecture & Standards
### 1. Atomic Design
- Components are organized into **Atoms**, **Molecules**, and **Organisms**.
- **Atoms:** Phân tử nhỏ nhất (Buttons, Inputs, Icons, Labels).
- Tập trung vào việc tái sử dụng các Atoms từ Shadcn UI.

### 2. Loading Strategy (Skeletons)
- Sử dụng **Next.js Skeletons** chuẩn (chuẩn React Suspense).
- Mọi trang fetching dữ liệu (Home, Album Detail) phải có file `loading.tsx` hiển thị Skeleton khớp với layout thật.

### 3. Internationalization (i18n)
- Hỗ trợ đa ngôn ngữ (Tiếng Việt, Tiếng Anh).
- Sử dụng thư viện chuẩn cho Next.js App Router (e.g., `next-intl` hoặc tương đương).

### 4. Theme & Components
- **Dark Mode:** `#0F0F0F` (Background), `#FFFFFF` (Foreground).
- **Shadcn UI:** Nền tảng cho mọi component.

---

## Layout & Pages
- **Mobile-first:** Max-width `390px`.
- `/` — Home: Album Grid (Skeletons cho từng album card).
- `/album/[id]` — Detail: Track List (Skeletons cho từng dòng track).
- **Player Bar:** Global component.

# Music App API (Backend)

## 📌 Overview
This is the backend API for the Music App, built with **NestJS** and **Prisma ORM**.
It handles authentication, user management, song/album data, cloud storage, messaging, and background jobs.

## 🚀 Technologies
- **Framework:** NestJS
- **Database:** PostgreSQL via Prisma ORM
- **Authentication:** JWT, Google OAuth
- **Storage:** Supabase Storage, Google Drive API

## 📂 Core Modules
- **Auth:** User registration, login, JWT verification, Google OAuth.
- **Albums & Songs:** Management of music tracks and album metadata.
- **Storage & Downloader:** File uploading, downloading, and background cleanup.
- **Messages:** Messaging and notifications handling.
- **Admin:** Administrative endpoints for app management.

## 📖 Documentation
Detailed technical documentation and Data Flow for every single module can be found in the [`backend-docs/`](./backend-docs/) folder.

## ⚙️ Getting Started
```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables (Check .env)

# 3. Run database migrations
npx prisma migrate dev

# 4. Start development server
npm run start:dev
```

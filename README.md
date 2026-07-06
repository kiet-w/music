# Music App

Full-stack music streaming application with YouTube download, Google Drive integration, and mobile support via Capacitor.

## Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **State Management:** Zustand
- **Audio Player:** Howler.js
- **Mobile:** Capacitor (Android)
- **i18n:** next-intl
- **Monitoring:** Sentry

### Backend
- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Cache:** Redis (BullMQ)
- **Storage:** Supabase Storage
- **Auth:** JWT + Google OAuth 2.0
- **Pattern:** CQRS (Command Query Responsibility Segregation)
- **Monitoring:** Prometheus + Sentry

### Infrastructure
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx / Caddy
- **Logging:** Loki + Promtail + Prometheus

---

## Project Structure

```
music/
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   ├── store/           # Zustand stores
│   │   └── messages/        # i18n translations
│   ├── android/             # Capacitor Android project
│   ├── public/              # Static assets
│   └── package.json
│
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── auth/            # Authentication (JWT + Google OAuth)
│   │   ├── songs/           # Songs CRUD (CQRS pattern)
│   │   ├── albums/          # Albums management
│   │   ├── messages/        # Messaging & friend requests
│   │   ├── downloader/      # YouTube download (yt-dlp)
│   │   ├── google-drive/    # Google Drive integration
│   │   ├── storage/         # Supabase storage
│   │   ├── admin/           # Admin panel
│   │   ├── jobs/            # Background jobs (BullMQ)
│   │   ├── common/          # Shared utilities
│   │   └── prisma/          # Prisma service
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
├── docs/                     # Documentation (gitignored)
├── docker-compose.yml        # Development Docker Compose
└── .gitignore
```

---

## Database Schema

### Models

| Model | Description |
|-------|-------------|
| `User` | User accounts with Google OAuth support |
| `Album` | Music albums (each user has a default album) |
| `Track` | Songs/tracks with source tracking |
| `Message` | User-to-user messages |
| `FriendRequest` | Friend invitation system |
| `DownloadJob` | YouTube download job queue |

### Enums

- `UserRole`: `USER`, `ADMIN`
- `JobStatus`: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`

---

## Features

### Authentication
- Email/password registration & login
- Google OAuth 2.0 (unified login flow)
- JWT token-based authentication
- Role-based access control (USER, ADMIN)

### Music Management
- YouTube URL download via yt-dlp
- Album organization with default album per user
- Song CRUD operations (CQRS pattern)
- Move songs between albums

### Google Drive Integration
- OAuth2 connection to Google Drive
- Browse and import MP3 files
- Automatic metadata extraction

### Messaging
- User-to-user messaging
- Friend request system with invite links

### Mobile (Capacitor)
- Android app support
- Native file system access
- Preferences storage

### Monitoring & Observability
- Prometheus metrics (HTTP request duration, queue stats)
- Sentry error tracking (frontend + backend)
- Structured logging with Pino
- Loki + Promtail for log aggregation

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- yt-dlp (for YouTube downloads)
- ffmpeg (for audio conversion)

### Environment Variables

Create `.env` files in both `frontend/` and `backend/`:

**Backend `.env`:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/music
DIRECT_URL=postgresql://user:password@localhost:5432/music
JWT_SECRET=your-jwt-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
SENTRY_DSN=your-sentry-dsn
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGINS=http://localhost:3003
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### Installation

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Generate Prisma client
cd ../backend
npx prisma generate

# Run database migrations
npx prisma migrate dev
```

### Development

```bash
# Start backend (port 3000)
cd backend
npm run start:dev

# Start frontend (port 3003)
cd frontend
npm run dev

# Or use Turbo mode
npm run dev:turbo
```

### Docker

```bash
docker-compose up -d
```

---

## API Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Google OAuth login
- `GET /auth/me` - Get current user

### Songs
- `GET /songs` - List all songs (paginated)
- `GET /songs/:id` - Get song by ID
- `POST /songs/youtube` - Download from YouTube
- `PATCH /songs/:id/move` - Move to album
- `DELETE /songs/:id` - Delete song

### Albums
- `GET /albums` - List all albums
- `GET /albums/:id` - Get album by ID
- `POST /albums` - Create album

### Google Drive
- `GET /google-drive/status` - Check connection
- `GET /google-drive/auth-url` - Get OAuth URL
- `POST /google-drive/exchange-code` - Exchange OAuth code
- `GET /google-drive/files` - List MP3 files
- `POST /google-drive/import` - Import file

### Messages
- `GET /messages/:userId` - Get conversation
- `POST /messages` - Send message

### Friend Requests
- `POST /friend-requests/invite` - Create invite
- `GET /friend-requests/info/:token` - Get invite info (public)
- `POST /friend-requests/accept/:token` - Accept invite

### Admin
- `GET /admin/users` - List all users
- `POST /admin/cleanup` - Trigger cleanup job

---

## Scripts

### Backend
```bash
npm run start:dev        # Start with watch mode
npm run build            # Build for production
npm run start:prod       # Start production build
npm run test             # Run tests
npm run test:e2e         # Run e2e tests
npm run lint             # Lint code
npx prisma migrate dev   # Run migrations
npx prisma studio        # Open Prisma Studio
```

### Frontend
```bash
npm run dev              # Start dev server
npm run dev:turbo        # Start with Turbopack
npm run build            # Build for production
npm run start            # Start production build
npm run lint             # Lint code
```

---

## Deployment

### Production Build

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../frontend
npm run build

# Or use Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Android (Capacitor)

```bash
cd frontend
npm run build
npx cap sync android
npx cap open android
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

Private - All rights reserved

---

## Author

**kiet-w** - [GitHub](https://github.com/kiet-w)

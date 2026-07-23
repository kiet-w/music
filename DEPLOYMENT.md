# 🚀 Production Deployment Guide

## 📋 Prerequisites

Before deploying to production, ensure you have:

1. **Domain names** for:
   - Frontend (e.g., `music.yourdomain.com`)
   - Backend API (e.g., `api.music.yourdomain.com`)
   - Python AI service (if used)

2. **Server/Hosting**:
   - VPS/Cloud server (DigitalOcean, AWS, GCP, etc.)
   - Or container hosting (Docker, Kubernetes)
   - Or serverless platforms (Vercel, Netlify, etc.)

3. **Database**:
   - Supabase PostgreSQL database
   - Redis server for caching/queues

4. **Services**:
   - Google OAuth credentials
   - Gmail SMTP for emails
   - Sentry account for error tracking

## 🔧 Environment Setup

### 1. Backend Configuration

```bash
cd backend
cp .env.production.example .env.production
```

Edit `.env.production` with your actual values:

```env
PORT=4000
NODE_ENV=production
CORS_ORIGINS=https://music.yourdomain.com,https://www.music.yourdomain.com

# Database (Supabase)
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Security
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ENCRYPTION_KEY=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=https://music.yourdomain.com/api/auth/callback/google

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
MAIL_FROM="Music App <your-email@gmail.com>"

# Sentry
SENTRY_DSN=your-sentry-dsn
```

### 2. Frontend Configuration

```bash
cd frontend
cp .env.production.example .env.production
```

Edit `.env.production`:

```env
NEXT_PUBLIC_API_URL=https://api.music.yourdomain.com
NEXT_PUBLIC_PYTHON_API_URL=https://python-api.music.yourdomain.com
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
CAPACITOR_SERVER_URL=https://music.yourdomain.com
NEXT_PUBLIC_APP_URL=https://music.yourdomain.com
```

## 📦 Building for Production

### Automated Build

```bash
# From project root
./deploy.sh
```

### Manual Build

#### Backend Build
```bash
cd backend
export NODE_ENV=production
npm install
npm run build
```

#### Frontend Build
```bash
cd frontend
export NODE_ENV=production
cp .env.production .env.local
npm install
npm run build
```

#### Android APK Build
```bash
cd frontend
npx cap sync android
cd android
./gradlew assembleRelease
```

The APK will be at: `frontend/android/app/build/outputs/apk/release/app-release.apk`

## 🚀 Deployment Options

### Option 1: Traditional VPS Deployment

#### Backend Deployment
```bash
# Upload backend files to server
scp -r backend/dist user@your-server:/var/www/music-api
scp backend/.env.production user@your-server:/var/www/music-api/.env

# SSH into server
ssh user@your-server

# Install dependencies
cd /var/www/music-api
npm install --production

# Setup PM2
npm install -g pm2
pm2 start dist/main.js --name music-api
pm2 save
pm2 startup
```

#### Frontend Deployment
```bash
# Upload frontend build to server
scp -r frontend/out user@your-server:/var/www/music-frontend

# Configure Nginx
sudo nano /etc/nginx/sites-available/music
```

Nginx configuration:
```nginx
server {
    listen 80;
    server_name music.yourdomain.com;
    
    root /var/www/music-frontend;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api-proxy/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 2: Docker Deployment

#### Backend Dockerfile
```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY .env.production .env

EXPOSE 4000

CMD ["node", "dist/main.js"]
```

#### Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

#### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      - NODE_ENV=production
    env_file:
      - backend/.env.production
    depends_on:
      - redis

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
```

### Option 3: Cloud Platform Deployment

#### Vercel (Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd frontend
vercel --prod
```

#### Railway/Render (Backend)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
cd backend
railway up
```

## 📱 Android APK Signing

### Generate Keystore
```bash
keytool -genkey -v -keystore music-release.keystore -alias music-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing
Edit `frontend/android/app/build.gradle`:

```gradle
signingConfigs {
  release {
    storeFile file('../../music-release.keystore')
    storePassword System.getenv("KEYSTORE_PASSWORD")
    keyAlias System.getenv("KEY_ALIAS")
    keyPassword System.getenv("KEY_PASSWORD")
  }
}

buildTypes {
  release {
    signingConfig signingConfigs.release
    minifyEnabled true
    shrinkResources true
  }
}
```

### Build Signed APK
```bash
cd frontend/android
export KEYSTORE_PASSWORD=your_keystore_password
export KEY_ALIAS=music-key-alias
export KEY_PASSWORD=your_key_password
./gradlew assembleRelease
```

## 🔍 Post-Deployment Checklist

- [ ] Backend health check: `https://api.music.yourdomain.com/health`
- [ ] Frontend loads correctly
- [ ] User registration/login works
- [ ] Google OAuth functions properly
- [ ] Music playback works
- [ ] File uploads work
- [ ] Email sending works
- [ ] Sentry error tracking is active
- [ ] Database connections are stable
- [ ] Redis caching is working
- [ ] APK installs and runs on Android
- [ ] All API endpoints respond correctly
- [ ] SSL certificates are valid
- [ ] CORS configuration is correct
- [ ] Rate limiting is active
- [ ] Logging is working

## 📊 Monitoring

### Backend Monitoring
- **Sentry**: Error tracking (already configured)
- **Prometheus**: Metrics at `/metrics` endpoint
- **Logs**: Check PM2 logs: `pm2 logs music-api`

### Frontend Monitoring
- **Sentry**: Client-side error tracking
- **Performance**: Use Chrome DevTools Lighthouse

### Database Monitoring
- **Supabase Dashboard**: Monitor database performance
- **Redis**: Use `redis-cli` to monitor Redis stats

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
name: Deploy Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Build Backend
        run: |
          cd backend
          npm ci
          npm run build
      
      - name: Build Frontend
        run: |
          cd frontend
          npm ci
          npm run build
      
      - name: Deploy to Server
        uses: easingthemes/ssh-deploy@v4
        with:
          SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
          REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
          REMOTE_USER: ${{ secrets.REMOTE_USER }}
          TARGET: /var/www/music
```

## 🆘 Troubleshooting

### Common Issues

1. **Backend won't start**
   - Check environment variables
   - Verify database connection
   - Check logs: `pm2 logs music-api`

2. **Frontend build fails**
   - Clear Next.js cache: `rm -rf .next`
   - Verify environment variables
   - Check Node.js version

3. **APK won't install**
   - Verify signing configuration
   - Check Android SDK version
   - Ensure proper permissions

4. **Database connection fails**
   - Verify DATABASE_URL format
   - Check Supabase connection settings
   - Ensure IP whitelist allows your server

## 📞 Support

For issues during deployment:
1. Check logs first
2. Review this guide
3. Check Sentry for errors
4. Consult platform documentation
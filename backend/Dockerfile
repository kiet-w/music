# ────────────────────────────────────────────────────
# Stage 1: Install dependencies
# ────────────────────────────────────────────────────
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat python3 make g++ wget bash coreutils

WORKDIR /app

# Copy package files first for Docker layer caching
COPY package.json package-lock.json ./
COPY scripts/ ./scripts/

# Install all dependencies (including devDependencies for build)
RUN npm install

# ────────────────────────────────────────────────────
# Stage 2: Generate Prisma Client + Build
# ────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build NestJS
RUN npm run build

# Prune devDependencies for production
RUN npm prune --production

# ────────────────────────────────────────────────────
# Stage 3: Production Runner
# ────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache \
  python3 \
  ffmpeg \
  wget \
  bash \
  coreutils \
  tini \
  openssl

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nestjs && \
    adduser --system --uid 1001 nestjs

# Copy production dependencies and build output
COPY --from=builder --chown=nestjs:nestjs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nestjs /app/dist ./dist
COPY --from=builder --chown=nestjs:nestjs /app/prisma ./prisma

# Copy yt-dlp binary (pre-verified by install script)
COPY --from=deps --chown=nestjs:nestjs /app/yt-dlp ./yt-dlp

# Copy package.json and start script
COPY --chown=nestjs:nestjs package.json ./
COPY --chown=nestjs:nestjs start.sh ./
RUN chmod +x ./start.sh

# Ensure temp directory exists and is writable by nestjs
RUN mkdir -p /app/temp && chown -R nestjs:nestjs /app

USER nestjs

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=10000

# Security-sensitive variables must be provided at runtime or via Docker secrets
# REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
# JWT_SECRET, JWT_EXPIRES_IN, ENCRYPTION_KEY, DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_KEY
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, SENTRY_DSN

# Use tini as init system for proper signal handling
ENTRYPOINT ["tini", "--"]

# Run automatic migration and start production server
CMD ["./start.sh"]

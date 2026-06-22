# Deployment Guide

## 1. Local Development Setup

### Prerequisites
- Node.js ≥ 18
- Docker + Docker Compose
- PostgreSQL (hoặc dùng Docker)
- Redis (hoặc dùng Docker)

### Bước 1: Clone và cài dependencies

```bash
git clone <repo>
cd music

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Bước 2: Cấu hình environment

```bash
# Root .env (cho docker-compose)
cp .env.example .env
# Điền các giá trị thật

# Backend .env riêng (nếu chạy local không qua Docker)
cd backend
cp .env.example .env
```

### Bước 3: Database setup

```bash
cd backend

# Apply migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# (Optional) Seed data
npx prisma db seed
```

### Bước 4: Chạy development

```bash
# Terminal 1: Backend
cd backend
npm run start:dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Hoặc dùng Docker Compose (dev)
docker compose up -d redis  # Chỉ cần Redis, chạy app local
```

Backend: `http://localhost:4000`
Frontend: `http://localhost:3000`
Swagger: `http://localhost:4000/api`

---

## 2. Docker Compose — Development

File: `docker-compose.yml`

```bash
# Start tất cả services (dev)
docker compose up -d

# Chỉ start Redis + DB
docker compose up -d redis db

# Xem logs
docker compose logs -f backend

# Stop
docker compose down
```

Services trong dev compose:
- `backend` — NestJS (port 4000)
- `frontend` — Next.js (port 3000)
- `redis` — BullMQ queue
- `db` — PostgreSQL (nếu có trong compose)

---

## 3. Production Deployment

### File: `docker-compose.prod.yml`

```bash
# Trước khi deploy, tạo .env production
cp .env.example .env
# Điền TẤT CẢ giá trị production (xem .env.example)

# Build và start
docker compose -f docker-compose.prod.yml up -d --build

# Chạy migrations production (QUAN TRỌNG: làm trước khi start app)
docker compose -f docker-compose.prod.yml run --rm backend \
  npx prisma migrate deploy

# Xem logs
docker compose -f docker-compose.prod.yml logs -f backend

# Restart service cụ thể
docker compose -f docker-compose.prod.yml restart backend
```

### Services Production Stack

| Service | Image | Port Exposed | Mục đích |
|---------|-------|-------------|---------|
| `backend` | Custom (Dockerfile) | Internal | NestJS API |
| `frontend` | Custom (Dockerfile) | Internal | Next.js |
| `caddy` | `caddy:2-alpine` | 80, 443 | Reverse proxy + auto TLS |
| `redis` | `redis:7-alpine` | Internal | BullMQ queue |
| `loki` | `grafana/loki:2.9.2` | Internal | Log storage |
| `promtail` | `grafana/promtail:2.9.2` | Internal | Log shipper |
| `prometheus` | `prom/prometheus:latest` | Internal | Metrics storage |
| `grafana` | `grafana/grafana:latest` | 3001 | Metrics + logs UI |
| `db-backup` | `prodrigestivill/postgres-backup-local:16` | Internal | Daily DB backup |

---

## 4. Dockerfile — Backend

File: `backend/Dockerfile`

```dockerfile
# Multi-stage build để giảm image size

# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY yt-dlp ./yt-dlp  # Binary bundled
RUN chmod +x ./yt-dlp

EXPOSE 4000
CMD ["node", "dist/main"]
```

> ⚠️ `yt-dlp` binary được bundle trực tiếp trong repo (`backend/yt-dlp`). Cần update định kỳ hoặc download trong Dockerfile.

---

## 5. Caddy — Reverse Proxy Config

File: `Caddyfile`

```caddyfile
{$DOMAIN} {
    # Frontend
    handle /* {
        reverse_proxy frontend:3000
    }

    # Backend API
    handle /api/* {
        uri strip_prefix /api
        reverse_proxy backend:4000
    }
}
```

Caddy tự động:
- Obtain SSL certificate từ Let's Encrypt
- Renew certificate trước khi hết hạn
- HTTP → HTTPS redirect
- HTTP/3 support (port 443/udp)

---

## 6. Database Migration Strategy

### Development
```bash
# Tạo migration mới
npx prisma migrate dev --name add_user_avatar

# Reset database (chỉ dev!)
npx prisma migrate reset
```

### Production (KHÔNG bao giờ dùng `migrate dev`)
```bash
# Apply migrations đã có
npx prisma migrate deploy

# Kiểm tra migration status
npx prisma migrate status
```

### Zero-Downtime Migration (thêm column NOT NULL)

```
❌ Sai: ALTER TABLE ADD COLUMN name TEXT NOT NULL
   → Fail nếu bảng có data

✅ Đúng (2-step):
   Step 1: Thêm column nullable, deploy app (backward compat)
   Step 2: Backfill data, set NOT NULL constraint, deploy lại
```

---

## 7. Kubernetes Probes

Nếu deploy lên K8s, dùng các endpoints sau:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 4000
  initialDelaySeconds: 30
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health    # Hoặc /health/ready nếu implement
    port: 4000
  initialDelaySeconds: 10
  periodSeconds: 5
```

> `GET /health` trả `{ "status": "ok" }` — liveness check (app process còn sống)
> Nếu implement `/health/ready`: check DB + Redis connectivity

---

## 8. Backup Strategy

### Database Backup (Tự động)

`db-backup` service trong `docker-compose.prod.yml` dùng `postgres-backup-local`:

```yaml
environment:
  - SCHEDULE=@daily        # Backup mỗi ngày
  - BACKUP_KEEP_DAYS=7     # Giữ 7 ngày gần nhất
volumes:
  - db_backups:/backups    # Lưu local
```

### Manual Backup

```bash
# Backup
docker exec <db-container> pg_dump -U dbuser music_db > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i <db-container> psql -U dbuser music_db < backup_20240115.sql
```

### Supabase Storage Backup

Files nhạc lưu trên Supabase — dùng Supabase dashboard để export hoặc dùng API để download.

---

## 9. Monitoring Setup

### Prometheus — truy cập metrics
- Tự động scrape `backend:4000/metrics` mỗi 15s (theo `prometheus.yml`)
- Data lưu 30 ngày (`--storage.tsdb.retention.time=30d`)

### Grafana — visualize
- URL: `http://yourdomain.com:3001`
- Default login: `GRAFANA_USER` / `GRAFANA_PASSWORD`
- Add datasource: Prometheus (`http://prometheus:9090`)
- Add datasource: Loki (`http://loki:3100`)

### Loki + Promtail — logs
- Promtail collect logs từ Docker containers
- Ship to Loki
- Query trong Grafana: `{container="music-backend-1"}`

---

## 10. Pre-Deploy Checklist

```
Environment Variables:
  [ ] DATABASE_URL + DIRECT_URL trỏ đúng production DB
  [ ] JWT_SECRET ngẫu nhiên, ≥ 32 chars
  [ ] ENCRYPTION_KEY là 32-byte hex (64 chars)
  [ ] CORS_ORIGINS = domain production thật
  [ ] SUPABASE_URL + SUPABASE_KEY đúng
  [ ] SENTRY_DSN được set
  [ ] GRAFANA_PASSWORD đổi từ default

Database:
  [ ] npx prisma migrate deploy đã chạy thành công
  [ ] Kiểm tra prisma migrate status = "All migrations applied"

Build:
  [ ] docker compose -f docker-compose.prod.yml build không có error
  [ ] Image size reasonable (< 1GB)

Network:
  [ ] Domain DNS trỏ về server IP
  [ ] Ports 80 + 443 + 443/udp mở trên firewall
  [ ] Port 5432 (PostgreSQL) KHÔNG exposed ra internet
  [ ] Port 6379 (Redis) KHÔNG exposed ra internet

Post-Deploy:
  [ ] GET /health trả 200 ok
  [ ] GET /metrics trả Prometheus data
  [ ] Login flow hoạt động
  [ ] YouTube download test (1 link ngắn)
  [ ] Grafana dashboard load được data
  [ ] Sentry nhận test error
```
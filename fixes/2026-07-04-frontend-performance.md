# ⚡ Fix Log #2 — Frontend Performance Optimization

> **Ngày:** 04/07/2026  
> **Phạm vi:** Next.js 14 frontend, Turbopack, Sentry, build config  
> **Trạng thái:** ✅ Đã khắc phục

---

## Vấn đề: Compile quá chậm, mỗi route phải đợi 2-8 giây

**Triệu chứng:**
```
○ Compiling /[locale]/register ...
✓ Compiled /[locale]/register in 35.8s (2071 modules)
○ Compiling /[locale]/albums ...
✓ Compiled /[locale]/albums in 2.6s (2080 modules)
○ Compiling /[locale]/music ...
✓ Compiled /[locale]/music in 4.3s (2129 modules)
```

Mỗi route compile riêng lẻ theo từng request, không có pre-compile toàn bộ app.

---

## Phân tích nguyên nhân

| # | Nguyên nhân | Ảnh hưởng |
|---|------------|----------|
| 1 | Next.js dùng **Webpack** (mặc định) thay vì Turbopack | Compile chậm ~5-10x |
| 2 | **Sentry** wrap toàn bộ config, inject source-map code vào mọi bundle | Overhead nặng khi dev |
| 3 | `output: 'standalone'` bật cả trong dev | Xử lý thêm không cần thiết |
| 4 | TypeScript/ESLint check chạy song song với compile | IDE đã check sẵn rồi, trùng lặp |

---

## Cách khắc phục

### 1. Bật Turbopack (Rust-based bundler)

```bash
# Thêm vào package.json
"dev:turbo": "next dev -p 3003 --turbopack"
```

Turbopack biên dịch nhanh hơn Webpack ~5-10x, hỗ trợ incremental compile — chỉ compile lại những file thay đổi.

### 2. Tách config theo môi trường trong `next.config.js`

```js
const isDev = process.env.NODE_ENV === 'development';

// Chỉ bật standalone khi production (build Docker)
...(isDev ? {} : { output: 'standalone' }),

// Chỉ wrap Sentry khi production
const finalConfig = isDev
  ? withNextIntl(nextConfig)
  : withSentryConfig(withNextIntl(nextConfig), ...);
```

### 3. Tắt TypeScript & ESLint check khi dev

```js
typescript: { ignoreBuildErrors: isDev },
eslint:     { ignoreDuringBuilds: isDev },
```

### 4. Tối ưu Webpack watchOptions

```js
webpack: (config, { dev }) => {
  if (dev) {
    config.watchOptions = {
      poll: false,          // Dùng native inotify, không polling
      aggregateTimeout: 200,
    };
  }
  return config;
},
```

### 5. Xóa cache cũ

```bash
rm -rf .next
```

---

## Kết quả kỳ vọng

| Chỉ số | Trước | Sau (Turbopack) |
|--------|-------|----------------|
| Compile lần đầu | 13-35s | ~3-5s |
| Hot reload sau khi sửa file | 2-8s | < 500ms |
| Overhead Sentry trong dev | Cao | Không có |

---

## Cách dùng từ nay

```bash
# Chạy frontend với Turbopack (nhanh nhất)
npm run dev:turbo

# Hoặc lệnh cũ (vẫn còn, dùng Webpack)
npm run dev
```

> ⚠️ Khi **build production** (`npm run build`), Sentry và standalone mode vẫn được bật đầy đủ như bình thường.

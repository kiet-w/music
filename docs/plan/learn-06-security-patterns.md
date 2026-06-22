# Security Patterns — Tư Duy "Kẻ Tấn Công Nghĩ Gì"

> **Nguyên tắc**: Bảo mật không phải là tính năng thêm vào sau — là tư duy từ đầu. Câu hỏi đúng là: "Nếu tôi muốn tấn công hệ thống này, tôi sẽ thử cách nào?"

---

## I. Defense In Depth — Không Tin Bất Kỳ Lớp Nào Là Đủ

### Nguyên Tắc

Mỗi lớp validation là một tường thành độc lập. Nếu một lớp bị bypass, lớp khác vẫn bảo vệ.

```
[Client] → [DTO Validation] → [Guard/Auth] → [Service] → [Repository] → [DB]
              Layer 1            Layer 2        Layer 3      Layer 4      Layer 5

Nếu chỉ validate ở Layer 1:
  → Admin script gọi Layer 3 trực tiếp → bypass hoàn toàn
  → Test fixture tạo data không qua DTO → bypass
  → Service được inject vào module khác → bypass
```

### SSRF Defense In Depth

**Threat**: Attacker gửi URL `http://169.254.169.254/latest/meta-data/` (AWS metadata endpoint) thay vì YouTube URL → server fetch nội dung internal service.

```typescript
// Layer 1: DTO validation (first line of defense)
@IsYouTubeUrl()
url: string;

// Layer 2: Service validation (second line — service có thể được gọi từ nơi khác)
async download(url: string): Promise<string> {
  const hostname = new URL(url).hostname;
  const allowedHosts = ['www.youtube.com', 'youtube.com', 'youtu.be'];
  
  if (!allowedHosts.includes(hostname)) {
    throw new ForbiddenException('URL must be a YouTube URL');
  }
  // Chỉ sau khi verify mới spawn process
  await this.spawnYtDlp(url, outputPath);
}
```

**Tại sao không tin DTO validation đủ**:
1. `DownloaderService` có thể được gọi từ admin tool không qua DTO
2. Custom DTO validator có thể bị implement sai
3. Future developer thêm endpoint mới quên add validator

### Input Validation Defense

```typescript
// ❌ Validate format nhưng không validate semantic
@IsUrl()  // passes: http://internal-service/secret-endpoint

// ✅ Validate format + semantic
@IsUrl()
@Matches(/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/, {
  message: 'Must be a YouTube URL'
})
```

---

## II. Authentication & Authorization

### JWT — Verify Signature Locally

```typescript
// ❌ Không verify — tin bất kỳ token nào
const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

// ✅ Verify signature — đảm bảo token được issue bởi server của bạn
const payload = await this.jwtService.verifyAsync(token, {
  secret: this.configService.get('JWT_SECRET')
});
```

**JWT Security Checklist**:
- [ ] `JWT_SECRET` đủ dài (>= 32 bytes, random)
- [ ] `JWT_SECRET` được rotate định kỳ (hoặc có kế hoạch rotate)
- [ ] TTL ngắn (access token: 15 phút - 1 giờ)
- [ ] Không lưu sensitive data trong payload (email ok, password hash KHÔNG)
- [ ] Verify `iss` (issuer) nếu có nhiều service issue token

### RBAC — Separation of Concerns

```typescript
// ❌ Check role trong business logic — khó test, khó maintain
@Get('admin/users')
async getUsers(@Request() req) {
  if (req.user.role !== 'ADMIN') throw new ForbiddenException();
  return this.userService.findAll();
}

// ✅ Tách access control ra khỏi business logic
@Get('admin/users')
@Roles(UserRole.ADMIN)          // declarative — dễ đọc, dễ test
@UseGuards(JwtAuthGuard, RolesGuard)  // guard enforce access control
async getUsers() {
  return this.userService.findAll();  // service không biết/lo về auth
}
```

**RolesGuard implementation**:
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()]  // method-level > class-level
    );
    
    if (!requiredRoles) return true;  // không có @Roles → public
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.role === role);
  }
}
```

### Graceful Schema Migration

**Vấn đề**: Thêm field mới vào JWT payload → token cũ không có field → guard throw → mass logout.

```typescript
// ❌ Strict — token cũ bị reject
const user = { role: payload.role };  // undefined nếu token cũ

// ✅ Graceful fallback — backward compatible
const user = { 
  role: payload.role ?? UserRole.USER  // default khi không có
};
```

**Khi nào dùng fallback, khi nào reject**:
- `role` thiếu → fallback về least-privilege (USER) → safe
- `sub` (userId) thiếu → reject → không biết user là ai, không thể proceed
- `iat` (issued at) thiếu → reject → không thể validate token age

---

## III. Encryption & Secret Management

### AES-256-GCM — Authenticated Encryption

```typescript
// ❌ AES-CBC — chỉ confidentiality, không verify integrity
// Attacker có thể flip bits → decrypt ra garbage nhưng không biết

// ✅ AES-GCM — confidentiality + integrity + authentication
encrypt(data: string): string {
  const iv = crypto.randomBytes(16);         // Random mỗi lần
  const cipher = crypto.createCipheriv(
    'aes-256-gcm', 
    this.key,                                 // 32-byte key từ env
    iv
  );
  
  const encrypted = Buffer.concat([
    cipher.update(data, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();       // 16-byte authentication tag
  
  // Format: iv:authTag:encrypted (dễ parse, dễ debug)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

decrypt(encrypted: string): string {
  const [ivHex, authTagHex, dataHex] = encrypted.split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));  // Verify integrity
  // Nếu data bị tamper → throw error tại đây
  
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final()
  ]).toString('utf8');
}
```

**Tại sao random IV quan trọng**:
- Cùng key + same IV + same plaintext → same ciphertext → attacker detect patterns
- Random IV mỗi lần encrypt → cùng plaintext → different ciphertext → không detect

### Lazy Token Migration

```typescript
// Vấn đề: Tokens cũ chưa được encrypt (plain text trong DB)
// Giải pháp: Tự phát hiện và migrate khi đọc lần đầu

async getDecryptedTokens(userId: string): Promise<GoogleTokens> {
  const record = await this.googleTokenRepo.findOne(userId);
  
  // Detect: token chưa encrypt không có ':' separator
  if (!record.accessToken.includes(':')) {
    // Legacy plain text token — migrate ngay
    const encryptedAccess = this.encryptionService.encrypt(record.accessToken);
    const encryptedRefresh = this.encryptionService.encrypt(record.refreshToken);
    
    await this.googleTokenRepo.update(userId, {
      accessToken: encryptedAccess,
      refreshToken: encryptedRefresh,
    });
    
    return { 
      accessToken: record.accessToken,  // trả về unencrypted cho lần này
      refreshToken: record.refreshToken 
    };
  }
  
  // Modern encrypted token
  return {
    accessToken: this.encryptionService.decrypt(record.accessToken),
    refreshToken: this.encryptionService.decrypt(record.refreshToken),
  };
}
```

**Ưu điểm của lazy migration**:
- Không cần migration script (script có thể fail giữa chừng)
- Không cần downtime
- Không cần 2-phase deploy (deploy mới + run migration)
- Token tự migrate khi user active → inactive user không block rollout

---

## IV. Secret Handling — Zero Tolerance

### Fail-Closed Config

```typescript
// ❌ Fail-open — CORS mở khi thiếu config
const corsOrigins = process.env.CORS_ORIGINS || '*';  // Mở toang nếu quên set env!

// ✅ Fail-closed — crash khi thiếu config
const corsOriginsRaw = process.env.CORS_ORIGINS;
if (!corsOriginsRaw) {
  throw new Error('CORS_ORIGINS env var is required');  // App không start
}
const corsOrigins = corsOriginsRaw.split(',').map(o => o.trim());
```

**Triết lý fail-closed**:
- Chạy với config sai → bad behavior im lặng → hard to detect → risk grows
- Crash ngay → noise immediate → on-call biết ngay → fix nhanh → risk bounded

**Áp dụng cho mọi security-critical config**:
```typescript
// JWT_SECRET thiếu → crash (không phải dùng default)
// ENCRYPTION_KEY thiếu → crash (không phải dùng hardcoded key)
// DATABASE_URL thiếu → crash (không phải connect localhost)
```

### Secret Redaction — Nhiều Lớp

```typescript
// Lớp 1: pino config — redact ở log framework level
pino({
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      '*.password',
      '*.accessToken',
      '*.refreshToken',
    ],
    censor: '[REDACTED]',
  }
})

// Lớp 2: LoggingInterceptor — redact thêm ở HTTP interceptor level
const safeRequest = {
  ...request,
  headers: {
    ...request.headers,
    authorization: undefined,
    cookie: undefined,
  }
};
```

**Test secret redaction**:
```typescript
it('should not log authorization header', async () => {
  const logs = captureLog(() => {
    logger.info({ req: { headers: { authorization: 'Bearer secret123' } } });
  });
  expect(logs[0]).not.toContain('secret123');
  expect(logs[0]).toContain('[REDACTED]');
});
```

---

## V. OAuth Security — Token Handling

### Token Revocation

```typescript
// ❌ Dùng xong không revoke — token sống đến khi expire (có thể vài giờ)
const tokens = await oauth2Client.getToken(code);
// ... use token
// ... forget to revoke

// ✅ Revoke ngay sau khi xong
try {
  const tokens = await this.getAccessToken(code);
  await this.importDriveFiles(tokens);
} finally {
  // Revoke dù success hay failure — minimize attack window
  if (window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(tokens.access_token);
  }
}
```

### OAuth State Parameter

```typescript
// State prevent CSRF trong OAuth flow
async generateAuthUrl(userId: string): Promise<string> {
  const state = crypto.randomUUID();  // Unguessable random state
  
  // Lưu state → userId mapping trong cache (không DB để tự expire)
  await this.cacheManager.set(
    `oauth_state:${state}`, 
    userId, 
    300_000  // 5 phút TTL — state expire nếu user abandon flow
  );
  
  return this.oauth2Client.generateAuthUrl({
    state,
    scope: ['https://www.googleapis.com/auth/drive.readonly'],
    access_type: 'offline',
  });
}

async handleCallback(code: string, state: string): Promise<void> {
  // Verify state — prevent CSRF
  const userId = await this.cacheManager.get<string>(`oauth_state:${state}`);
  if (!userId) throw new ForbiddenException('Invalid or expired OAuth state');
  
  // Delete state sau khi dùng — prevent replay
  await this.cacheManager.del(`oauth_state:${state}`);
  
  // Continue với code exchange...
}
```

---

## VI. Supply Chain Security

### Binary Dependency Verification (yt-dlp)

**Threat**: Attacker compromise yt-dlp download server → inject malicious binary → chạy trên server của bạn với quyền của process.

```bash
# ❌ Download và chạy không verify
curl -o /usr/local/bin/yt-dlp https://example.com/yt-dlp
chmod +x /usr/local/bin/yt-dlp

# ✅ Pin version + verify SHA-256
YT_DLP_VERSION="2024.1.1"
YT_DLP_SHA256="abc123..."

curl -o /tmp/yt-dlp "https://github.com/yt-dlp/yt-dlp/releases/download/${YT_DLP_VERSION}/yt-dlp"

# Verify trước khi cấp quyền execute
echo "${YT_DLP_SHA256}  /tmp/yt-dlp" | sha256sum --check
if [ $? -ne 0 ]; then
  echo "Checksum mismatch! Aborting."
  rm /tmp/yt-dlp
  exit 1
fi

mv /tmp/yt-dlp /usr/local/bin/yt-dlp
chmod +x /usr/local/bin/yt-dlp
```

**Principle of least privilege cho spawned processes**:
```typescript
// Không chạy yt-dlp với full app permissions
// Tạo dedicated user với minimal permissions
// Download directory isolated, không access code directory
```

---

## Bức Tranh Lớn: Security Layers

```
┌─────────────────────────────────────────┐
│ Config Layer                            │
│  • Fail-closed (no defaults for secrets)│
│  • Joi validation schema                │
│  • Swagger off in production            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Network Layer                           │
│  • CORS whitelist                       │
│  • Rate limiting (ThrottlerModule)      │
│  • HTTPS (Caddy/nginx TLS)              │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Auth Layer                              │
│  • JWT verify signature                 │
│  • RBAC via metadata reflection         │
│  • Graceful backward compat (role ??)   │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Input Layer                             │
│  • DTO validation (class-validator)     │
│  • SSRF check (URL whitelist)           │
│  • Pagination cap                       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Business Logic Layer                    │
│  • SSRF re-check (service level)        │
│  • Ownership validation (user owns res?)│
│  • Audit log (admin actions)            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Data Layer                              │
│  • AES-256-GCM for sensitive fields     │
│  • DTO serialization (@Expose whitelist)│
│  • No raw secrets in responses          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ Observability Layer                     │
│  • Secret redaction (2 independent)     │
│  • Audit trail (admin actions)          │
│  • Sentry error capture                 │
└─────────────────────────────────────────┘
```

**Câu hỏi tự kiểm mỗi feature mới**:
1. Endpoint này có thể được gọi mà không cần auth không?
2. Input có thể trigger server call đến internal network không? (SSRF)
3. Response có leak sensitive fields không?
4. Secret có bao giờ qua log không?
5. User A có thể access resource của User B không? (authorization bypass)

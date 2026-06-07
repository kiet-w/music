## 4. System Data Flow

**1. Khởi tạo StorageService**
- Flow: System khởi động -> `StorageService.constructor()` -> `initializeSupabase()` -> `ConfigService.get('SUPABASE_URL'/'SUPABASE_KEY')` -> `isValidUrl()` -> `createClient()` (Supabase).

**2. Upload file từ Disk (upload)**
- Flow: Caller -> `StorageService.upload()` -> `fs.promises.access()` (Check tồn tại) -> `fs.promises.readFile()` -> `supabase.storage.from(bucket).upload(path, fileBuffer)` -> Trả về `data.path` cho Caller.

**3. Upload Buffer/Stream (uploadBuffer, uploadStream)**
- Flow: Caller -> `StorageService.uploadBuffer()` / `uploadStream()` -> `supabase.storage.from(bucket).upload(path, buffer/stream)` -> Trả về `data.path` cho Caller.

**4. Lấy Public URL (getPublicUrl)**
- Flow: Caller -> `StorageService.getPublicUrl()` -> `supabase.storage.from(bucket).getPublicUrl(path)` -> Trả về `publicUrl` cho Caller.

**5. Xóa/Cleanup File (delete, cleanupFile)**
- Flow qua CleanupService: Caller -> `StorageCleanupService.cleanupFile()` -> `IStorageProvider.delete()` -> `StorageService.delete()` -> `supabase.storage.from(bucket).remove([path])` -> DB/S3 Supabase xóa file.

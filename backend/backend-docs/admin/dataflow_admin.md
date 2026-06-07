## 4. System Data Flow

**1. DELETE `/admin/tracks/:id` (deleteTrack)**
- Flow: Client -> Controller (`deleteTrack()`) -> Service (`deleteTrack()`) -> Repository (`SongRepository.delete()`) -> DB (Xóa bản ghi) -> Repository -> Service -> Controller -> Client.

**2. POST `/admin/storage/cleanup` (cleanupStorage)**
- Flow: Client -> Controller (`cleanupStorage()`) -> Service (`cleanupStorage()`) -> Service (`StorageCleanupService.cleanupFile()`) -> Bucket / External Storage (Xóa file) -> Service (Build object response) -> Controller -> Client.

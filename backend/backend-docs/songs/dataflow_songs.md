## 4. System Data Flow

**1. POST `/songs/youtube` (createFromYoutube)**
- Flow: Client -> Controller (`createFromYoutube()`) -> Service (`createFromYoutube()`) -> Service (`getValidatedAlbumId()`) -> `AlbumRepository` / `AlbumService` -> DB (Check quyền album hoặc tạo mới) -> Service -> `SongRepository.create()` -> DB (Lưu track mới) -> Service -> `conversionQueue.add()` -> BullMQ (Job) -> Service (`mapToResponse()`) -> Controller -> Client.

**2. GET `/songs` (findAll)**
- Flow: Client -> Controller (`findAll()` -> parse `page/limit` tính skip/take) -> Service (`findAll()`) -> `SongRepository.count()` & `SongRepository.findMany()` -> DB (Truy vấn) -> Service (`mapToResponseArray()`) -> Controller -> Client.

**3. GET `/songs/:id` (findOne)**
- Flow: Client -> Controller (`findOne()`) -> Service (`findOne()`) -> Service (`findAndValidateSong()`) -> `SongRepository.findFirst()` -> DB (Check join album user) -> Service (`mapToResponse()`) -> Controller -> Client.

**4. DELETE `/songs/:id` (remove)**
- Flow: Client -> Controller (`remove()`) -> Service (`remove()`) -> Service (`findAndValidateSong()`) -> `SongRepository.findFirst()` -> DB -> Service -> `SongRepository.delete()` -> DB (Thực thi xóa) -> Controller (204) -> Client.

**5. PATCH `/songs/:id/move` (moveToAlbum)**
- Flow: Client -> Controller (`moveToAlbum()`) -> Service (`moveToAlbum()`) -> Service (`findAndValidateSong()`) -> DB -> Service (`getValidatedAlbumId()`) -> DB (Kiểm tra album mới) -> Service -> `SongRepository.update()` -> DB (Lưu albumId mới) -> Service (`mapToResponse()`) -> Controller -> Client.

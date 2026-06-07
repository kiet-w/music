## 4. System Data Flow

**1. GET `/google-drive/status`**
- Flow: Client -> `JwtAuthGuard` -> Controller (`getStatus()`) -> Cache (`cacheManager.get()`) -> (nếu miss cache) -> Service (`isConnected()`) -> Prisma (`user.findUnique()`) -> DB -> Cache (`cacheManager.set()`) -> Controller -> Client.

**2. GET `/google-drive/auth-url`**
- Flow: Client -> `JwtAuthGuard` -> Controller (`getAuthUrl()`) -> Service (`generateAuthUrl()`) -> Cache (`cacheManager.set(state, userId)`) -> Google OAuth2Client (`generateAuthUrl()`) -> Controller -> Client.

**3. POST `/google-drive/exchange-code`**
- Flow: Client -> `JwtAuthGuard` -> Controller (`exchangeCode()`) -> Service (`exchangeCodeForTokens()`) -> Cache (`cacheManager.get(state)`) -> (Xác thực state match userId) -> Google OAuth2Client (`getToken(code)`) -> Cache (`cacheManager.del(state)`) -> Prisma (`user.update()`) -> DB -> Service -> Controller -> Client.

**4. GET `/google-drive/files`**
- Flow: Client -> `JwtAuthGuard` -> Controller (`listFiles()`) -> Service (`listFiles()`) -> Service (`setCredentials()`) -> Prisma (`user.findUnique()`) -> DB -> Google API (`drive.files.list()`) -> Google Server -> Service (Filter & Map shortcuts) -> Controller -> Client.

**5. POST `/google-drive/import` & POST `/music/import`**
- Flow: Client -> `JwtAuthGuard` -> Controller (`importFile()`) -> Service (`importFile()`) -> Service (`resolveAlbumId()`) -> `AlbumRepository`/`AlbumService` -> DB -> Service (`getFileMetadata()`) -> Google API -> Service (`validateMp3()`) -> Service (`downloadFile()`) -> Google API -> Service (Stream) -> `StorageService` (`uploadStream()`) -> (Storage Backend) -> `StorageService` (`getPublicUrl()`) -> `SongRepository` (`create()`) -> DB -> Service -> Controller -> Client.

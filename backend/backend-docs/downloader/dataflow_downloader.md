## 4. System Data Flow

**1. Phương thức `download(url, outputPath)`**
- Flow: Caller -> `DownloaderService` (`download()`) -> OS Child Process (`yt-dlp` via `execFileAsync`) -> File System (Lưu file tại `outputPath`) -> Trả về kết quả cho `DownloaderService` -> Caller.

**2. Phương thức `cleanup(filePath)`**
- Flow: Caller -> `DownloaderService` (`cleanup()`) -> Node.js File System (`fs.existsSync` -> `fs.unlinkSync`) -> Hệ điều hành (Xóa file) -> Caller.

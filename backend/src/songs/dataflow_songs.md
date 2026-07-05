# Songs System Data Flow

Tài liệu chi tiết đường đi của dữ liệu từ Client cho đến Database.

## 1. POST `/songs/youtube` (Tạo bài hát từ Youtube)
`Client` 
  ➔ `JwtAuthGuard` (Kiểm tra token) 
  ➔ `ThrottlerGuard` (Rate limiting) 
  ➔ `SongsController.createFromYoutube` (Nhận body `CreateSongYoutubeDto`) 
  ➔ `SongsService.createFromYoutube` (Khởi tạo `CreateSongFromYoutubeCommand`) 
  ➔ `CommandBus.execute` 
  ➔ `CreateSongFromYoutubeHandler.execute`
      ➔ `AlbumValidationHelper.getValidatedAlbumId` ➔ `AlbumRepository` / `AlbumService` (DB check)
      ➔ `YoutubeSongHelper.extractYoutubeId`
      ➔ `SongRepository.findByYoutubeId` (Check trùng)
      ➔ [Nhánh A: Đã tồn tại] ➔ `SongRepository.create` (Lưu đè URL cũ)
      ➔ [Nhánh B: Chưa tồn tại] ➔ `SongRepository.create` (Tạo URL rỗng) ➔ `BullMQ: conversionQueue.add()`
  ➔ `YoutubeSongHelper.mapToResponse`
  ➔ Trả về cho Client.

## 2. GET `/songs` (Lấy danh sách phân trang)
`Client` 
  ➔ `JwtAuthGuard` 
  ➔ `SongsController.findAll` (Nhận `PaginationDto` từ query) 
  ➔ `SongsService.findAll` (Khởi tạo `FindAllSongsQuery`) 
  ➔ `QueryBus.execute`
  ➔ `FindAllSongsHandler.execute`
      ➔ Tính toán offset (`skip`, `take`)
      ➔ `Promise.all` 
         - `SongRepository.countByUser` (DB Query count)
         - `SongRepository.findAllByUser` (DB Query findMany)
      ➔ `YoutubeSongHelper.mapToResponseArray`
  ➔ Trả về `{ data, total, page, limit, totalPages }`.

## 3. GET `/songs/:id` (Lấy chi tiết)
`Client` 
  ➔ `JwtAuthGuard` 
  ➔ `SongsController.findOne` (Nhận `id` từ param) 
  ➔ `SongsService.findOne` (Khởi tạo `FindOneSongQuery`) 
  ➔ `QueryBus.execute`
  ➔ `FindOneSongHandler.execute`
      ➔ `SongRepository.findByUserAndId`
      ➔ Nếu null: Ném `NotFoundException`
      ➔ Nếu có: `YoutubeSongHelper.mapToResponse`
  ➔ Trả về thông tin chi tiết.

## 4. DELETE `/songs/:id` (Xóa bài hát)
`Client` 
  ➔ `JwtAuthGuard` 
  ➔ `SongsController.remove`
  ➔ `SongsService.remove` (Khởi tạo `RemoveSongCommand`) 
  ➔ `CommandBus.execute`
  ➔ `RemoveSongHandler.execute`
      ➔ `SongRepository.findByUserAndId`
      ➔ Nếu null: Ném lỗi.
      ➔ Nếu có: `SongRepository.delete` (DB Delete)
  ➔ Trả về `204 No Content`.

## 5. PATCH `/songs/:id/move` (Đổi Album)
`Client` 
  ➔ `JwtAuthGuard` 
  ➔ `SongsController.moveToAlbum` (Nhận `MoveSongDto`)
  ➔ `SongsService.moveToAlbum` (Khởi tạo `MoveSongToAlbumCommand`) 
  ➔ `CommandBus.execute`
  ➔ `MoveSongToAlbumHandler.execute`
      ➔ `SongRepository.findByUserAndId`
      ➔ `AlbumValidationHelper.getValidatedAlbumId`
      ➔ `SongRepository.update` (Update albumId vào DB)
      ➔ `YoutubeSongHelper.mapToResponse`
  ➔ Trả về thông tin bài hát mới cập nhật.

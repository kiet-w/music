# Kế hoạch triển khai Cải tiến Trình phát Nhạc và Quản lý Bài hát

> **Dành cho các agent:** YÊU CẦU SUB-SKILL: Sử dụng superpowers:subagent-driven-development (khuyến nghị) hoặc superpowers:executing-plans để triển khai kế hoạch này theo từng tác vụ. Các bước sử dụng cú pháp dấu kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Nâng cấp trình phát nhạc với thanh thời gian mượt mà, thêm chức năng xóa và di chuyển bài hát sang album khác, hỗ trợ đầy đủ tiếng Việt.

**Kiến trúc:** 
- Backend: Thêm các endpoint REST trong NestJS để xử lý xóa và cập nhật album.
- Frontend: Sử dụng Radix UI (qua shadcn) cho các Dialog, và Tailwind CSS cho giao diện Slider tùy chỉnh.
- State: Sử dụng Zustand để quản lý trạng thái bài hát hiện tại.

**Tech Stack:** NestJS, Prisma, Next.js, Tailwind CSS, Radix UI, Howler.js.

---

### Tác vụ 1: Backend - Endpoint xóa bài hát

**Files:**
- Modify: `backend/src/songs/song.service.ts`
- Modify: `backend/src/songs/song.controller.ts`

- [ ] **Bước 1: Cập nhật SongService để thêm phương thức xóa**
```typescript
async remove(id: string) {
  return this.songRepository.delete({ where: { id } });
}
```

- [ ] **Bước 2: Cập nhật SongController để thêm endpoint DELETE**
```typescript
@Delete(':id')
async remove(@Param('id') id: string) {
  return this.songService.remove(id);
}
```

---

### Tác vụ 2: Backend - Endpoint di chuyển bài hát

**Files:**
- Modify: `backend/src/songs/song.service.ts`
- Modify: `backend/src/songs/song.controller.ts`

- [ ] **Bước 1: Cập nhật SongService để thêm phương thức di chuyển**
```typescript
async moveToAlbum(id: string, albumId: string) {
  return this.songRepository.update({
    where: { id },
    data: { albumId },
  });
}
```

- [ ] **Bước 2: Cập nhật SongController để thêm endpoint PATCH**
```typescript
@Patch(':id/move')
async moveToAlbum(@Param('id') id: string, @Body('albumId') albumId: string) {
  return this.songService.moveToAlbum(id, albumId);
}
```

---

### Tác vụ 3: Frontend - Cập nhật ngôn ngữ tiếng Việt

**Files:**
- Modify: `frontend/src/messages/vi.json`

- [ ] **Bước 1: Thêm các từ khóa mới**
```json
{
  "Music": {
    "delete": "Xóa",
    "move": "Di chuyển",
    "delete_confirm": "Xác nhận xóa bài hát",
    "delete_warning": "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa bài hát này?",
    "move_to_album": "Di chuyển đến Album",
    "select_album": "Chọn album đích",
    "cancel": "Hủy",
    "confirm": "Xác nhận"
  }
}
```

---

### Tác vụ 4: Frontend - Thêm nút Xóa và Di chuyển vào Library

**Files:**
- Modify: `frontend/src/components/molecules/Library/Library.tsx`

- [ ] **Bước 1: Import biểu tượng Trash2 và FolderInput từ lucide-react**
- [ ] **Bước 2: Thêm các nút bấm mới vào giao diện từng bài hát**
```tsx
<Button 
  size="sm" 
  variant="ghost"
  className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 hover:text-red-500"
  onClick={(e) => handleDeleteClick(e, track)}
>
  <Trash2 size={14} />
</Button>
<Button 
  size="sm" 
  variant="ghost"
  className="h-8 w-8 p-0 rounded-full opacity-0 group-hover:opacity-100 hover:text-primary"
  onClick={(e) => handleMoveClick(e, track)}
>
  <FolderInput size={14} />
</Button>
```

---

### Tác vụ 5: Frontend - Nâng cấp thanh thời gian (Player Timeline)

**Files:**
- Modify: `frontend/src/components/molecules/Player/Player.tsx`

- [ ] **Bước 1: Cập nhật CSS cho thanh input range để dễ kéo hơn**
- [ ] **Bước 2: Thêm hiệu ứng hover và active cho slider thumb**
```css
/* Thêm vào Tailwind class */
input[type='range']::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  transition: all 0.2s;
}
input[type='range']:hover::-webkit-slider-thumb {
  transform: scale(1.2);
  box-shadow: 0 0 10px rgba(var(--primary), 0.5);
}
```

# 🐍 Python FastAPI Music Converter Service (Lean MVP)

Microservice chuyển đổi nhạc YouTube/URL thành MP3 hiệu năng cao, nhẹ nhàng, sử dụng **FastAPI** và **`yt-dlp` native module**.

---

## ⚡ Tính năng nổi bật
1. **Dùng module `yt_dlp` native**: Gọi trực tiếp thư viện Python, không tốn tài nguyên chạy CLI subprocess.
2. **Không dùng `aria2c`**: Tránh bị YouTube rate-limit (lỗi 429) do tải quá nhiều luồng song song.
3. **Dùng `BackgroundTasks` tích hợp**: Chuyển đổi nhạc ngầm mượt mà không cần duy trì hệ thống Redis / Celery rườm rà.
4. **An toàn bộ nhớ**: Sử dụng thư mục tạm tiêu chuẩn hệ thống (`/tmp`), loại bỏ rủi ro hết RAM (`/dev/shm` OOM).

---

## 🚀 Hướng dẫn chạy Local

```bash
# 1. Đi vào thư mục
cd python-backend

# 2. Tạo virtualenv và cài thư viện
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Chạy server
python3 main.py
```

Server sẽ lắng nghe tại: `http://localhost:8001` (Docs Swagger: `http://localhost:8001/docs`).

---

## 📡 API Endpoints

- `GET /health` - Kiểm tra trạng thái server.
- `GET /info?url=...` - Lấy thông tin bài hát (tên, ca sĩ, thumbnail) siêu tốc (~0.5s) chưa cần tải file.
- `POST /convert` - Nhận request convert, trả về `taskId` trong 10ms và chạy ngầm.
- `GET /status/{taskId}` - Kiểm tra tiến độ convert (`processing` / `completed` / `failed`).
- `GET /download/{filename}` - Tải/Phát file MP3 trực tiếp.

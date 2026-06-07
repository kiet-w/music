# Sơ đồ Kiến trúc & Phân tích Hệ thống (Diagrams)

Thư mục này chứa các sơ đồ SVG mô tả kiến trúc, luồng dữ liệu, vòng đời xử lý và các use case của hệ thống. Dưới đây là danh sách phân loại chi tiết giúp bạn dễ dàng tra cứu:

## 1. 🏗️ Tổng quan Hệ thống & Kiến trúc (System Architecture & Overview)
Nhóm này mô tả cấu trúc tổng thể của các thành phần trong hệ thống, cách chúng liên kết với nhau và cấu trúc dữ liệu.

* **[backend-components.svg](./architecture/backend-components.svg)**: Sơ đồ kiến trúc Backend (NestJS modules, services, controllers, queues, DB).
* **[frontend-components.svg](./architecture/frontend-components.svg)**: Sơ đồ kiến trúc Frontend (Next.js routes, Zustand stores, hooks, API helpers).
* **[data-flow-boundaries.svg](./architecture/data-flow-boundaries.svg)**: Sơ đồ ranh giới luồng dữ liệu xuyên suốt giữa Browser/UI, Backend NestJS và Infrastructure (DB, Storage, Redis, Worker).
* **[database-erd.svg](./architecture/database-erd.svg)**: Sơ đồ quan hệ thực thể cơ sở dữ liệu (ERD) từ Prisma Schema (User, Album, Track) cùng các quy tắc ràng buộc.

## 2. 👤 Các kịch bản sử dụng (Use Cases)
Nhóm này tập trung vào góc nhìn của người dùng/hệ thống và các hành động họ có thể thực hiện.

* **[usecase-overview.svg](./use-cases/usecase-overview.svg)**: Bức tranh toàn cảnh về các use case của ứng dụng (User, Admin, Backend Worker và Google Account).
* **[album-song-usecases.svg](./use-cases/album-song-usecases.svg)**: Chi tiết các use case liên quan đến quản lý Album và Bài hát, đồng thời minh họa cách hệ thống kiểm tra quyền sở hữu (Ownership checks) qua JWT.

## 3. 🔐 Xác thực & Phân quyền (Authentication Flow)
Mô tả logic xác thực, phân quyền và quản lý phiên.

* **Mức độ tổng quan:**
  * **[auth-sequence.svg](./auth/auth-sequence.svg)**: Sequence diagram thể hiện luồng giao tiếp giữa Frontend và Backend khi Login và khởi tạo phiên (Hydration).
  * **[auth-lifecycle.svg](./auth/auth-lifecycle.svg)**: Vòng đời của phiên đăng nhập (Session Lifecycle) ở phía Client (chưa có token, có token, verify và redirect).
* **Mức độ Module / Kiến trúc NestJS:**
  * **[auth-module-dependency.svg](./auth/auth-module-dependency.svg)**: Biểu đồ phụ thuộc (Dependency Injection) của các Provider, Service bên trong `AuthModule`.
* **Mức độ chi tiết từng Layer (Deep dive):**
  * **[auth-dto-validation.svg](./auth/auth-dto-validation.svg)**: Luồng kiểm tra dữ liệu đầu vào (ValidationPipe) của Request Body.
  * **[auth-guard-canactivate.svg](./auth/auth-guard-canactivate.svg)**: Luồng hoạt động của `JwtAuthGuard`, cách trích xuất và xác minh Token từ request.
  * **[auth-login-controller.svg](./auth/auth-login-controller.svg)**: Luồng xử lý request HTTP POST `/auth/login` tại tầng Controller.
  * **[auth-register-service.svg](./auth/auth-register-service.svg)**: Logic mã hóa mật khẩu và tạo user tại tầng `AuthService.register`.
  * **[auth-repository-query.svg](./auth/auth-repository-query.svg)**: Cách tầng Repository truy vấn xuống Prisma DB.

## 4. 🧩 Luồng xử lý các Module Chức năng (Feature Module Flows)
Mô tả luồng đi của dữ liệu (Request -> Controller -> Service -> Repository -> Database) cho các nghiệp vụ chính.

* **[albums-module-flow.svg](./modules/albums-module-flow.svg)**: Luồng kỹ thuật đầy đủ của module Albums (tạo mới, lấy danh sách kèm số lượng bài hát, lấy chi tiết, và cơ chế cache).
* **[admin-module-flow.svg](./modules/admin-module-flow.svg)**: Luồng xử lý của module Admin, minh họa thiết kế module không có Service riêng mà Controller gọi trực tiếp đến Repository và Storage Cleanup Service.

## 5. 🔄 Vòng đời Xử lý & Tích hợp (Lifecycles & Async Processes)
Nhóm này minh họa sự chuyển đổi trạng thái của các tiến trình xử lý bất đồng bộ, luồng tải nhạc và tích hợp bên ngoài.

* **[youtube-track-lifecycle.svg](./lifecycles/youtube-track-lifecycle.svg)**: Vòng đời tải nhạc từ YouTube (Pending -> BullMQ Queued -> Downloading qua yt-dlp -> Uploading -> Ready/Playable).
* **[google-drive-lifecycle.svg](./lifecycles/google-drive-lifecycle.svg)**: Vòng đời import nhạc từ Google Drive (Lấy Token UI -> Call API Google -> Backend upload sang Storage -> Track Ready).
* **[playback-offline-lifecycle.svg](./lifecycles/playback-offline-lifecycle.svg)**: Vòng đời phát nhạc trên PlayerBar, ra quyết định chọn URL phát online (Remote) hay file tải sẵn (Local Offline).
* **[realtime-lifecycle.svg](./lifecycles/realtime-lifecycle.svg)**: Vòng đời làm mới dữ liệu thời gian thực (Supabase Realtime Subscriptions) trên giao diện (Mounted -> Event Received -> Refetch -> UI Update).
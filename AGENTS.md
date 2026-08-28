# Devin Agent Rules - Music Project

## 🔴 CRITICAL FILES - KHÔNG SỬA KHÔNG CÓ YÊU CẦU RÕ RÀNG

### API Layer (Mạch máu kết nối frontend-backend)
- `frontend/src/lib/api.ts` - File tuyệt đối không sửa trừ khi user yêu cầu rõ ràng
- `frontend/src/lib/api.types.ts` (nếu có) - Type definitions cho API responses

### State Management (Zustand stores)
- `frontend/src/store/useAuthStore.ts`
- `frontend/src/store/usePlayerStore.ts` 
- `frontend/src/store/useChatStore.ts`
- `frontend/src/store/useAlbumStore.ts`
- `frontend/src/store/useDownloadHistoryStore.ts`

### Core Logic Hooks (API calling hooks)
- `frontend/src/hooks/useAuthGate.ts`
- `frontend/src/hooks/useGoogleDrive.ts`
- `frontend/src/hooks/useGoogleCallback.ts`
- `frontend/src/hooks/useYoutubeDownloader.ts`
- `frontend/src/hooks/useAlbums.ts`
- `frontend/src/hooks/useAlbumDetail.ts`
- `frontend/src/hooks/useChatSubscription.ts`
- `frontend/src/hooks/useFriends.ts`

### Routing & Auth Configuration
- `frontend/src/app/` - Route structure (chỉ sửa khi có yêu cầu rõ ràng)
- Middleware files if any

---

## 🟢 SAFE TO MODIFY - CÓ THỂ VIBE CODE THOẢI MÁI

### UI Components (Style, layout, animation)
- `frontend/src/components/atoms/**/*`
- `frontend/src/components/molecules/**/*`
- `frontend/src/components/organisms/**/*` (nếu có)
- `frontend/src/components/templates/**/*`
- `frontend/src/components/pages/**/*`

### UI-Only Hooks (không gọi API)
- `frontend/src/hooks/useKeyboardMode.ts`
- `frontend/src/hooks/useKeyboardVisible.ts`
- `frontend/src/hooks/useKeyboardHeight.ts`
- `frontend/src/hooks/useOfflineStorage.ts`

### Utility Functions (không liên quan API/network)
- `frontend/src/lib/utils.ts`
- `frontend/src/lib/security.ts`
- `frontend/src/lib/userStatus.ts`
- `frontend/src/lib/inviteCookie.ts`

### Styles & Assets
- `frontend/src/styles/**/*` (nếu có)
- `frontend/public/**/*`

---

## 🔐 QUY TRÌNH LÀM VIỆC AN TOÀN

### Khi user yêu cầu thay đổi UI/style:
1. **CHỈ** sửa files trong vùng 🟢 SAFE TO MODIFY
2. KHÔNG đụng vào API layer, state management, core hooks
3. Test lại UI thay đổi, đảm bảo không ảnh hưởng chức năng khác
4. Commit sau khi UI chạy ổn định

### Khi user yêu cầu thay đổi logic/chức năng:
1. Xác nhận rõ scope: chỉ file cụ thể nào được phép sửa
2. Nếu cần sửa critical files → BẮT BUỘC hỏi user xác nhận trước
3. Test kỹ luồng dữ liệu liên quan
4. Review diff với user trước khi commit

### Khi phát hiện lỗi kết nối/luồng dữ liệu:
1. **DỪNG LẠI** mọi thay đổi UI không liên quan
2. Tập trung vào API layer và core hooks
3. Fix từng bước nhỏ, test sau mỗi bước
4. Không refactor cấu trúc thư mục khi chưa ổn định

---

## 📁 CẤU TRÚC THƯ MỤC ĐỀ XUẤT (CHO TƯƠNG LAI)

Dùng **feature-based thuần**, không trộn lẫn Atomic Design:

```
frontend/src/
├── lib/                    # Critical utilities
│   ├── api.ts             # 🔴 KHÔNG SỬA
│   ├── api.types.ts       # 🔴 KHÔNG SỬA
│   └── utils.ts           # 🟢 An toàn
├── store/                 # 🔴 State management
│   ├── useAuthStore.ts
│   ├── usePlayerStore.ts
│   └── ...
├── hooks/                 # Hooks
│   ├── api/               # 🔴 API calling hooks
│   │   ├── useAuth.ts
│   │   ├── useAlbums.ts
│   │   └── ...
│   └── ui/                # 🟢 UI-only hooks
│       ├── useKeyboardMode.ts
│       └── ...
├── components/            # 🟢 UI components
│   ├── ui/                # Reusable UI components (Button, Input, Modal...)
│   └── features/          # Feature-based components
│       ├── music/
│       │   ├── youtube/
│       │   ├── drive/
│       │   └── player/
│       ├── chat/
│       ├── albums/
│       └── auth/
└── app/                   # 🔴 Next.js routing
```

---

## ⚠️ QUY TẮC QUAN TRỌNG

1. **KHÔNG bao giờ** sửa `lib/api.ts` khi user chỉ yêu cầu "làm đẹp UI"
2. **LUÔN LUÔN** hỏi xác nhận trước khi sửa files trong vùng 🔴
3. **Test kỹ** luồng kết nối backend sau mỗi thay đổi logic
4. **Commit từng bước nhỏ**, không refactor lớn cùng lúc
5. **Respect cấu trúc hiện tại** nếu user chưa yêu cầu refactor

---

## 🚨 KHI GẶP VẤN ĐỀ

Nếu thấy lỗi kết nối API, authentication failure, hoặc luồng dữ liệu bị lỗi:
1. **Dừng ngay** thay đổi đang làm
2. Kiểm tra `lib/api.ts` xem có bị sửa vô tình không
3. Kiểm tra các store hooks xem có bị thay đổi không
4. Report ngay cho user với diff files bị ảnh hưởng

---

## 📝 HISTORY & NOTES

- **2026-07-23**: Created initial rules to protect API layer and state management
- **Backend connection flow**: APK ↔ Render - cần ổn định trước khi refactor UI structure
- **Current state**: Using Atomic Design structure, will migrate to feature-based in future

<!-- code-review-graph MCP tools -->
## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes_tool` or `query_graph_tool` instead of Grep
- **Understanding impact**: `get_impact_radius_tool` instead of manually tracing imports
- **Code review**: `detect_changes_tool` + `get_review_context_tool` instead of reading entire files
- **Finding relationships**: `query_graph_tool` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview_tool` + `list_communities_tool`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes_tool` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context_tool` | Need source snippets for review — token-efficient |
| `get_impact_radius_tool` | Understanding blast radius of a change |
| `get_affected_flows_tool` | Finding which execution paths are impacted |
| `query_graph_tool` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes_tool` | Finding functions/classes by name or keyword |
| `get_architecture_overview_tool` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes_tool` for code review.
3. Use `get_affected_flows_tool` to understand impact.
4. Use `query_graph_tool` pattern="tests_for" to check coverage.

---

## ⚡ BẮT BUỘC: HEADROOM, RTK & CODE REVIEW GRAPH (ORCA STANDARD)

Khi làm việc trong môi trường Orca / Antigravity trên dự án này, BẮT BUỘC tuân thủ:

1. **Headroom Proxy (Cổng 8787)**:
   - Mọi kết nối Agent LLM phải định tuyến qua `http://127.0.0.1:8787` (Headroom proxy) để nén context, cache token và giảm chi phí.
2. **RTK (Rust Token Killer)**:
   - **BẮT BUỘC** thêm tiền tố `rtk` trước mọi câu lệnh shell/bash (`rtk git ...`, `rtk ls ...`, `rtk grep ...`, `rtk find ...`, `rtk npm ...`, v.v.) để nén và lọc output, giảm tải tối đa token context.
3. **Code Review Graph**:
   - **BẮT BUỘC** dùng các tool của `code-review-graph` (`query_graph_tool`, `semantic_search_nodes_tool`, `detect_changes_tool`, `get_impact_radius_tool`) để duyệt mã nguồn trước khi dùng grep/glob/read thủ công.


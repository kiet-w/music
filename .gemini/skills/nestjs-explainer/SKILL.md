---
name: nestjs-explainer
description: >
  Giải thích chi tiết code NestJS để người dùng học và hiểu sâu. Dùng skill này khi người dùng paste code NestJS. BẮT BUỘC tách phần giải thích text và phần sơ đồ (Mermaid diagrams, E2E flows) ra 2 file .md riêng biệt.
---

# NestJS Code Explainer Skill

Mục tiêu: Giải thích code NestJS đã có theo chiều sâu. Bắt buộc vẽ Mermaid diagram minh hoạ luồng thực thi NHƯNG PHẢI TÁCH RA FILE `.md` RIÊNG BIỆT.
Output bằng tiếng Việt. Không gen code mới. Không tạo plan.

---

## Workflow (Progressive Disclosure)

**Khi nhận được code từ người dùng:**
1. Xác định loại file được cung cấp.
2. Đọc file hướng dẫn tương ứng trong thư mục `references/` BẰNG `read_file` tool.
3. Áp dụng các hướng dẫn chi tiết trong reference file đó để sinh output.
4. BẮT BUỘC XUẤT RA 2 FILE RIÊNG BIỆT:
   - File 1: `[tên-module]-explanation.md` (chứa toàn bộ giải thích text chi tiết).
   - File 2: `[tên-module]-flows.md` (chứa toàn bộ E2E Request Flows và Mermaid Diagrams).

---

## Cấu trúc Output (BẮT BUỘC 2 FILE)

### File 1: `[tên]-explanation.md`
Chứa giải thích text (Sections 1-6, 8-12). Format chuẩn:
```markdown
### [Tên file/component]
**Mục đích**: [1 câu]

**[Tên method/field/decorator]**
→ Làm gì: [giải thích cụ thể]
→ Tại sao dùng cách này: [reasoning]
→ Nếu không có/dùng cách khác: [consequence cụ thể]
```
*(Ghi chú: Tại vị trí lý ra chứa Diagram, hãy để lại dòng link: "👉 Chi tiết sơ đồ luồng dữ liệu xem tại file `[tên]-flows.md`")*

### File 2: `[tên]-flows.md`
Chứa Section 7 (End-to-End Flows) và TẤT CẢ Flow Diagrams (Mermaid) của tất cả các file. Đảm bảo sơ đồ chi tiết và đầy đủ. Format chuẩn:
```markdown
# Diagrams & E2E Flows: [Tên Module/Component]

## 1. End-to-End Request Flows
[Flow từng bước của Controller & Service]

## 2. Mermaid Flow Diagrams
[Sơ đồ Dependency Module]
[Sơ đồ Request Pipe -> Controller -> Service -> Repo]
[Sơ đồ Validation DTO]
[Sơ đồ Guard canActivate]
```

---

## Quy tắc bắt buộc
- **TÁCH FILE LÀ BẮT BUỘC**: Không gộp chung text giải thích và diagram/E2E Flow vào cùng 1 file. File flows phải chứa đầy đủ mọi sơ đồ yêu cầu.
- **QUÉT MÃ NGUỒN TOÀN DIỆN (MICRO-TECHNICAL DETAIL)**: Không được bỏ sót bất kỳ method nào (Public, Private, Protected), bất kỳ decorator nào, bất kỳ field nào trong DTO, hay bất kỳ custom method nào trong Repository. Phải liệt kê đầy đủ tất cả Entry Point URL (Method + Path).
- Giải thích bằng tiếng Việt.
- Mỗi decorator, method, pattern đều phải có "tại sao".
- Mỗi exception phải nêu: class + message + HTTP status + tại sao.
- Nếu code có vấn đề bảo mật → mention ở cuối phần "Gaps & Recommendations".

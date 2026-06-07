# Định dạng Output khi phân tích

Với mỗi file được paste vào, output theo format:

### Phân tích: [tên file]

**Vấn đề phát hiện:**
- [dòng X]: [mô tả vấn đề] → nên tách thành [method/class nào]

**Đề xuất tách:**

[Tên method/class mới]
- Loại: private method / public method / DTO / Repository method / Helper class
- Nằm ở: cùng file / file mới (nếu file mới thì tại sao)
- Lý do tách: [1-2 câu cụ thể dựa trên checklist và quy tắc tách]
- Code sau khi tách:
```typescript
// code ở đây
```

**File hoàn chỉnh sau khi refactor:**
```typescript
// full file ở đây
```

---

## Ghi chú cho AI
- Nếu code đã tốt, nói thẳng "không cần tách thêm" và giải thích tại sao.
- Luôn ưu tiên sự đơn giản và tính đóng gói.

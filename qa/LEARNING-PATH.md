# 🧪 QA Engineer — Lộ Trình Học Sâu

> Chia nhỏ theo module, sắp xếp theo **dependency** (cái trước là nền cho cái sau).
> Mỗi module là một đơn vị học độc lập. Học xong module trước rồi mới sang module sau.
> Không focus phỏng vấn — focus **hiểu bản chất** và **làm được thật**.

---

## Cách đọc tài liệu này

```
📘 = Lý thuyết cần đọc hiểu
🔧 = Thực hành bắt buộc
💡 = Insight / góc nhìn sâu
⏱️ = Thời gian ước tính
✅ = Tiêu chí hoàn thành module (tự check)
🔗 = Phụ thuộc module trước
🏷️ = Mức độ: [NỀN TẢNG] [CỐT LÕI] [NÂNG CAO] [CHUYÊN SÂU]
```

---

# PHẦN I — NỀN MÓNG TƯ DUY QA

> Phần này trả lời câu hỏi: "QA tồn tại để làm gì, và tư duy QA khác dev ở chỗ nào?"
> Nếu không nắm vững phần này, mọi thứ sau đều thiếu gốc.

---

## Module 1.1 — QA tồn tại để làm gì

`🏷️ NỀN TẢNG` `⏱️ 2-3 giờ` `🔗 Không phụ thuộc`

### 📘 Nội dung

**Tại sao phần mềm cần QA?**

Phần mềm khác sản phẩm vật lý ở chỗ: nó vô hình, phức tạp, và thay đổi liên tục. Một ứng dụng web đơn giản cũng có hàng nghìn "đường đi" khác nhau mà user có thể thực hiện. Con người viết code mắc lỗi — không phải vì kém, mà vì não người không thể hold hết tất cả trạng thái cùng lúc.

QA tồn tại vì một lý do đơn giản: **chi phí sửa lỗi tăng theo cấp số nhân theo thời gian**.

```
Chi phí sửa lỗi (tương đối):

Requirements  ████                           1x
Design        ████████                       3-6x
Coding        ████████████████               10x
Testing       ████████████████████████       15-40x
Production    ████████████████████████████   30-100x
```

Một bug ở giai đoạn requirement chỉ cần sửa 1 dòng spec. Cùng bug đó nếu để lọt ra production: cần hotfix code, rollback database, xử lý user bị ảnh hưởng, viết postmortem, mất uy tín. Chi phí gấp 30-100 lần.

**QA, QC, Testing — ba khái niệm khác nhau:**

Hãy hình dung một nhà máy sản xuất nước uống:

- **QA (Quality Assurance)** = thiết kế quy trình sản xuất: nguồn nước phải qua bao nhiêu bước lọc, nhiệt độ đóng chai bao nhiêu, công nhân phải rửa tay trước khi vào xưởng. QA lo **quy trình** — nếu quy trình đúng, sản phẩm sẽ tốt. Mang tính **phòng ngừa** (preventive).

- **QC (Quality Control)** = kiểm tra sản phẩm sau khi sản xuất: lấy mẫu nước từ dây chuyền, đo pH, đo vi khuẩn, kiểm tra tem nhãn. QC lo **sản phẩm** — sản phẩm cụ thể này có đạt chuẩn không. Mang tính **phát hiện** (detective).

- **Testing** = một hoạt động CỤ THỂ trong QC: cầm máy đo pH nhúng vào chai nước, đọc kết quả. Testing là hành động thực thi để tìm lỗi.

```
QA (quy trình) ⊃ QC (kiểm tra sản phẩm) ⊃ Testing (thực thi tìm lỗi)
```

Trong thực tế ở các công ty phần mềm, ranh giới thường bị mờ — người làm "QA" thường làm cả QC lẫn Testing. Nhưng hiểu rõ sự khác biệt giúp bạn biết mình đang làm gì ở mỗi thời điểm.

**Vai trò QA trong team phần mềm:**

QA không phải "người gác cổng" chặn release. QA là người đảm bảo team có đủ thông tin để quyết định release hay không. Cụ thể:

- Tham gia từ đầu: đọc requirement, hỏi câu hỏi làm rõ ("Nếu user nhập email sai format thì hiện thông báo gì?")
- Viết test case TRƯỚC hoặc SONG SONG với dev viết code
- Test sản phẩm khi dev hoàn thành
- Report bug, verify bug đã fix
- Đưa ra đánh giá: "Test xong 95% case, còn 2 bug minor → recommend release" hoặc "Còn 1 bug critical → block release"

### 💡 Góc nhìn sâu

Nếu bạn từng làm dev và tự hỏi "tại sao cần QA riêng, dev tự test được mà" — câu trả lời nằm ở **confirmation bias**. Dev viết code theo logic của mình, nên khi test cũng theo logic đó — vô tình bỏ qua các đường đi mà mình không nghĩ tới khi code. QA nhìn từ ngoài vào, không bị bias bởi cách implement → tìm được lỗi dev không thấy.

Điều này KHÔNG có nghĩa dev không cần test. Dev test ở level unit/integration (verify code chạy đúng logic). QA test ở level system/acceptance (verify sản phẩm hoạt động đúng từ góc user).

### 🔧 Bài tập

1. Mở webapp Next.js của bạn. Chọn 1 feature bạn tự code. Cố gắng **phá** nó — nhập sai, nhập thiếu, nhập quá dài, double click, back button giữa chừng, mở 2 tab cùng lúc. Ghi lại tất cả hành vi bất thường bạn tìm được.
2. Với mỗi hành vi bất thường, phân loại: đây là lỗi QA process (không có requirement rõ ràng), lỗi QC (code sai logic), hay lỗi chưa được test?

### ✅ Tiêu chí hoàn thành

- [ ] Giải thích được QA vs QC vs Testing bằng ví dụ thực tế, không cần nhìn tài liệu
- [ ] Giải thích được tại sao chi phí sửa lỗi tăng theo thời gian
- [ ] Hiểu vai trò QA trong team — không phải "gác cổng" mà là "cung cấp thông tin chất lượng"

---

## Module 1.2 — Tư duy QA: nghĩ khác dev

`🏷️ NỀN TẢNG` `⏱️ 2-3 giờ` `🔗 Module 1.1`

### 📘 Nội dung

**Adversarial Thinking — tư duy "nếu... thì sao?"**

Dev khi code feature "form đăng ký" nghĩ:
> "User nhập tên, email, password → validate → tạo account → redirect dashboard. Done."

QA khi test cùng feature nghĩ:
> "Nhưng nếu user nhập tên toàn space thì sao? Nếu email có dấu '+' thì sao? Nếu password đúng 8 ký tự (boundary) thì sao? Nếu submit 2 lần liên tiếp thì sao? Nếu mạng chập chờn giữa lúc submit thì sao? Nếu user copy-paste password có trailing space thì sao?"

Đây không phải pessimism — đây là **systematic skepticism**. QA giả định rằng mọi thứ CÓ THỂ sai ở bất kỳ đâu, và nhiệm vụ là chứng minh nó ĐÚNG (hoặc tìm ra chỗ sai).

**5 câu hỏi QA luôn tự hỏi:**
1. **"Input nào user có thể nhập mà dev không nghĩ tới?"** (edge cases)
2. **"Chuyện gì xảy ra ở ranh giới?"** (boundary values — min, max, empty, overflow)
3. **"Thứ tự thao tác nào có thể gây lỗi?"** (sequence — back button, double submit, refresh giữa chừng)
4. **"Trong điều kiện nào hệ thống sẽ fail?"** (environment — slow network, concurrent users, low storage)
5. **"Requirement có rõ ràng chưa, hay đang ambiguous?"** (requirement gap — "hiển thị thông báo lỗi" nhưng không nói NỘI DUNG thông báo là gì)

**Black Box, White Box, Gray Box — ba góc nhìn test**

Đây không chỉ là phân loại lý thuyết — nó quyết định CÁCH bạn thiết kế test case.

**Black Box (hộp đen):**
- Bạn KHÔNG biết (hoặc cố tình bỏ qua) code bên trong
- Chỉ quan tâm: input → output
- Ưu điểm: test từ góc user thật, không bị bias bởi implementation
- Nhược điểm: có thể bỏ sót path mà code có nhưng UI không expose
- Dùng khi: functional testing, UAT, exploratory testing
- VD: test login form — nhập đúng/sai email + password → kiểm tra kết quả. Không quan tâm backend dùng bcrypt hay argon2

**White Box (hộp trắng):**
- Bạn BIẾT và dựa vào cấu trúc code để thiết kế test
- Quan tâm: code coverage — mọi branch, loop, path đều được test
- Ưu điểm: coverage cao, tìm được bug ở logic ẩn
- Nhược điểm: tốn thời gian, không phản ánh trải nghiệm user thật
- Dùng khi: unit test, code review, security audit
- VD: đọc code function `calculateDiscount()`, thấy có 5 if-else branches → viết 5 test cases cover hết

**Gray Box (hộp xám):**
- Bạn biết MỘT PHẦN kiến trúc (API structure, DB schema, config) nhưng test từ bên ngoài
- Kết hợp ưu điểm cả hai: biết đủ để test thông minh, nhưng vẫn từ góc user
- Dùng khi: integration testing, API testing
- VD: biết API `/api/users` trả JSON với field `role`, test xem user với `role: "admin"` có thấy admin panel trên UI không

💡 **Với nền tảng dev:** bạn tự nhiên sẽ làm Gray Box — biết code bên trong nhưng test từ ngoài. Đây là lợi thế lớn so với QA không biết code: bạn biết chỗ nào dev HAY viết lỗi (null check, async race condition, off-by-one) nên test trúng hơn.

**Verification vs Validation — hai mặt của chất lượng**

- **Verification:** "Chúng ta có đang xây sản phẩm ĐÚNG CÁCH không?"
  - Kiểm tra: code có đúng spec không, design có đúng requirement không
  - Hoạt động: code review, walkthrough, static analysis, unit test
  - Hỏi spec: "Requirement nói button màu xanh → button trên UI có màu xanh không?"

- **Validation:** "Chúng ta có đang xây ĐÚNG SẢN PHẨM không?"
  - Kiểm tra: sản phẩm có giải quyết được vấn đề thật của user không
  - Hoạt động: UAT, beta testing, usability testing
  - Hỏi user: "Bạn dùng được không, có đúng thứ bạn cần không?"

Một sản phẩm có thể pass verification (code đúng spec) nhưng fail validation (spec sai, user không cần feature đó). QA cần quan tâm CẢ HAI.

### 🔧 Bài tập

1. **Chuyển đổi tư duy:** Lấy 1 feature trong app Next.js của bạn. Viết ra:
   - 5 test cases theo tư duy dev (happy path, "nó chạy đúng")
   - 10 test cases theo tư duy QA (edge case, "nó có thể sai ở đâu")
   - So sánh hai danh sách — pattern nào bạn thường bỏ sót khi nghĩ như dev?

2. **Phân loại:** Với cùng feature đó, phân loại mỗi test case bạn viết là Black Box, White Box, hay Gray Box. Giải thích tại sao.

### ✅ Tiêu chí hoàn thành

- [ ] Khi nhìn bất kỳ feature nào, tự động nghĩ ra ít nhất 5 câu hỏi "nếu... thì sao?"
- [ ] Phân biệt được khi nào mình đang test Black/White/Gray Box
- [ ] Hiểu Verification ≠ Validation bằng ví dụ thực tế

---

## Module 1.3 — Các loại testing: biết khi nào dùng cái nào

`🏷️ NỀN TẢNG` `⏱️ 3-4 giờ` `🔗 Module 1.2`

### 📘 Nội dung

Testing có RẤT NHIỀU loại — nhưng thay vì học danh sách phẳng, hãy hiểu chúng theo 2 chiều: **khi nào chạy** (timing) và **để làm gì** (mục đích).

### Chiều 1: Testing Levels — test ở tầng nào

Hãy tưởng tượng xây một ngôi nhà:

```
┌───────────────────────────────────────────────┐
│          Acceptance Testing (UAT)             │  ← Chủ nhà vào ở thử: "Nhà này
│          "Sản phẩm đúng nhu cầu user?"        │     có đáp ứng yêu cầu tôi không?"
├───────────────────────────────────────────────┤
│          System Testing (E2E)                 │  ← Kiểm tra toàn bộ: điện-nước-
│          "Toàn bộ hệ thống chạy đúng?"        │     gas-internet hoạt động cùng lúc
├───────────────────────────────────────────────┤
│          Integration Testing                  │  ← Kiểm tra kết nối: ống nước nối
│          "Các phần ghép lại chạy đúng?"        │     đúng vào bồn rửa chưa
├───────────────────────────────────────────────┤
│          Unit Testing                         │  ← Kiểm tra từng viên gạch: gạch
│          "Từng phần nhỏ chạy đúng?"            │     có đúng kích thước, chịu lực tốt
└───────────────────────────────────────────────┘
```

- **Unit Testing:** test 1 function/method riêng lẻ, tách biệt khỏi dependency bên ngoài (dùng mock). Dev viết chính. Nhanh, stable, số lượng nhiều nhất.

- **Integration Testing:** test 2+ components kết hợp. VD: API controller gọi service, service gọi database — cả chuỗi hoạt động đúng không? Dev + QA cùng viết.

- **System Testing (E2E):** test toàn bộ hệ thống từ đầu đến cuối, giống cách user thật dùng. VD: mở browser → login → tìm sản phẩm → thêm giỏ hàng → checkout → nhận confirmation. QA viết chính. Chậm, dễ flaky, nhưng sát thực tế nhất.

- **Acceptance Testing (UAT):** PO/user thật test để quyết định "sản phẩm này đạt yêu cầu, có thể release". QA hỗ trợ chuẩn bị environment và test data.

### Chiều 2: Testing Types — test với mục đích gì

**Nhóm 1: Test theo giai đoạn (khi nào chạy)**

| Loại | Khi nào | Mục đích | Phạm vi |
|---|---|---|---|
| **Smoke Test** | Sau mỗi build mới | Kiểm tra nhanh "app có chạy được không" | Rộng, nông (5-10 test cases quan trọng nhất) |
| **Sanity Test** | Sau khi fix bug / thêm feature nhỏ | Kiểm tra nhanh "cái vừa sửa có ổn không" | Hẹp, tập trung vào phần vừa thay đổi |
| **Regression Test** | Sau mỗi thay đổi code | Đảm bảo code mới không phá code cũ | Rộng, chạy lại toàn bộ test suite (hoặc subset) |

💡 **Flow thực tế trong sprint:**
```
Dev push code → Build mới → Smoke test (5 phút, app sống không?)
  → Pass? → Sanity test (15 phút, feature mới/fix đúng không?)
    → Pass? → Regression test (1-2 giờ, mọi thứ cũ vẫn ổn?)
      → Pass? → Ready for QA review
```

**Nhóm 2: Test theo phương pháp (test như thế nào)**

| Loại | Cách làm | Khi nào dùng |
|---|---|---|
| **Functional Testing** | Test chức năng theo requirement: input → expected output | Mọi lúc — loại test phổ biến nhất |
| **Exploratory Testing** | Không theo script, dùng kinh nghiệm + trực giác khám phá | Khi cần tìm bug ngoài kịch bản, khi requirement chưa rõ |
| **Regression Testing** | Chạy lại test cases cũ sau khi có thay đổi | Sau mỗi sprint, mỗi release |
| **Retesting** | Chạy lại ĐÚNG test case đã fail, sau khi dev fix | Khi verify bug fix |

💡 **Regression vs Retesting** (hay bị nhầm):
- **Retesting:** chạy lại test case X (đã fail) sau khi dev fix bug → xem bug X có thật sự được fix chưa
- **Regression:** chạy lại test case Y, Z, W (đã pass trước đó) → xem việc fix bug X có vô tình phá Y, Z, W không

**Nhóm 3: Test theo chiều (test cái gì)**

| Loại | Test cái gì | Ví dụ |
|---|---|---|
| **Positive Testing** | Input đúng → mong đợi kết quả đúng | Login đúng email + password → vào dashboard |
| **Negative Testing** | Input sai/bất thường → mong đợi xử lý gracefully | Login sai password → hiện "Invalid credentials", không crash |

💡 **Một QA giỏi viết ~40% positive + ~60% negative test cases.** Phần lớn lỗi thật nằm ở negative path — đường đi mà dev ít khi nghĩ tới khi code.

**Exploratory Testing — đi sâu hơn**

Exploratory testing là kỹ năng quan trọng nhất mà KHÔNG thể automation được. Nó đòi hỏi sự sáng tạo, trực giác, và khả năng "ngửi" thấy chỗ hay lỗi.

Cách làm (Session-Based Exploratory Testing):
1. **Charter:** mục tiêu session. VD: "Khám phá luồng checkout, tập trung vào xử lý lỗi payment"
2. **Time-box:** 60-90 phút (không dài hơn — mất focus)
3. **Ghi chú liên tục:** mỗi bước bạn làm, mỗi hành vi bất thường, mỗi câu hỏi nảy ra
4. **Debrief:** sau session, review ghi chú, tạo bug report nếu tìm được lỗi, tạo test case mới cho các scenario phát hiện

```
Session Log ví dụ:
─────────────────
Charter: Khám phá form đăng ký, focus error handling
Time: 14:00 - 15:00

14:05 - Thử submit form trống → hiện "Required" cho tất cả fields ✅
14:08 - Nhập email "abc" → hiện "Invalid email" ✅
14:12 - Nhập email "a@b" → ACCEPT?? 🐛 Có phải valid email?
        → Check RFC 5322: technically valid nhưng suspicious
        → Log as question cho PO: chấp nhận email 3 ký tự không?
14:18 - Nhập password 7 ký tự → reject ✅
14:20 - Nhập password 8 ký tự, toàn chữ thường → ACCEPT?? 🐛
        → Requirement nói "ít nhất 1 uppercase" nhưng form không validate
14:25 - Copy-paste password có trailing space → login fail sau đó 🐛
        → Password được hash kèm space, nhưng user nhập lại không có space
...
```

### 🔧 Bài tập

1. **Phân loại:** Lấy 10 test cases bạn đã viết ở Module 1.2, phân loại mỗi cái thuộc testing type nào (smoke/sanity/regression, positive/negative, functional/exploratory).

2. **Exploratory session:** Chạy 1 session exploratory testing 45 phút trên webapp của bạn (hoặc bất kỳ web app nào bạn hay dùng). Viết session log theo format ở trên. Mục tiêu: tìm ít nhất 3 hành vi bất thường.

### ✅ Tiêu chí hoàn thành

- [ ] Phân biệt được 4 testing levels (unit → acceptance)
- [ ] Phân biệt được smoke vs sanity vs regression vs retesting
- [ ] Phân biệt được positive vs negative testing, biết tại sao negative quan trọng hơn
- [ ] Đã chạy ít nhất 1 exploratory testing session và viết session log

---

## Module 1.4 — ISTQB 7 Nguyên tắc Testing

`🏷️ NỀN TẢNG` `⏱️ 1-2 giờ` `🔗 Module 1.3`

### 📘 Nội dung

ISTQB (International Software Testing Qualifications Board) đúc kết 7 nguyên tắc nền tảng. Đây không phải lý thuyết suông — mỗi nguyên tắc giải quyết một SAI LẦM phổ biến.

**1. Testing shows the presence of defects, not their absence**
- Sai lầm: "Chạy hết test case, tất cả pass → phần mềm không có lỗi!"
- Thực tế: Test chỉ chứng minh "tìm được lỗi" hoặc "chưa tìm thấy lỗi". Không bao giờ chứng minh "không còn lỗi" — vì bạn không thể test hết mọi tổ hợp input.
- Hệ quả: khi báo cáo, nói "95% test case pass" chứ không nói "phần mềm hoàn hảo"

**2. Exhaustive testing is impossible**
- Sai lầm: "Phải test hết mọi trường hợp mới release"
- Thực tế: 1 form có 5 fields, mỗi field 10 giá trị → 10^5 = 100,000 tổ hợp. Thêm thứ tự thao tác, trạng thái hệ thống... → hàng tỷ case. Không đủ thời gian trên đời để test hết.
- Hệ quả: phải CHỌN test thông minh (risk-based, equivalence partitioning, boundary value) thay vì test tất cả

**3. Early testing saves time and money**
- Sai lầm: "Dev code xong rồi QA vào test"
- Thực tế: tìm lỗi ở requirement sửa trong 1 giờ. Cùng lỗi đó để lọt tới production sửa trong 1 tuần + mất tiền + mất uy tín.
- Hệ quả: QA tham gia từ ĐẦU — review requirement, hỏi câu hỏi, viết test case song song dev code. Gọi là "shift-left testing"

**4. Defects cluster together (Pareto principle)**
- Sai lầm: "Chia đều effort test cho mọi module"
- Thực tế: 80% lỗi tập trung ở 20% module — thường là module phức tạp nhất, thay đổi nhiều nhất, hoặc code bởi người mới
- Hệ quả: theo dõi module nào hay lỗi → tập trung test thêm ở đó. Nếu module A liên tục sinh bug → cảnh báo team cần refactor

**5. Pesticide paradox**
- Sai lầm: "Có bộ test suite rồi, cứ chạy lại mãi là đủ"
- Thực tế: giống như côn trùng kháng thuốc — chạy cùng bộ test case hoài thì không tìm được lỗi MỚI. Test case cũ chỉ catch regression, không catch bug mới.
- Hệ quả: phải thường xuyên review và UPDATE test suite — thêm test case mới, sửa test case cũ không còn relevant, bổ sung exploratory testing

**6. Testing is context dependent**
- Sai lầm: "Áp dụng cùng quy trình test cho mọi project"
- Thực tế: test banking app (cần security + precision cực cao) hoàn toàn khác test game mobile (cần UX + performance trên nhiều device). Test embedded software (safety-critical) khác test website marketing.
- Hệ quả: mỗi project cần test strategy riêng, fit với context (domain, risk, deadline, resource)

**7. Absence-of-errors fallacy**
- Sai lầm: "App không có bug = app thành công"
- Thực tế: phần mềm không có lỗi kỹ thuật nhưng UX tệ, solve sai problem, hoặc chậm → vẫn thất bại. 99% test pass nhưng user không muốn dùng = fail.
- Hệ quả: QA không chỉ tìm bug kỹ thuật, còn phải đánh giá "sản phẩm này có usable không, có solve đúng vấn đề không" (validation, không chỉ verification)

### 🔧 Bài tập

Lấy lịch sử bug/issue của một project bạn từng làm (hoặc project open source trên GitHub). Tìm ví dụ thực tế cho ít nhất 4 trong 7 nguyên tắc trên. VD: module nào có nhiều bug nhất (nguyên tắc 4)?

### ✅ Tiêu chí hoàn thành

- [ ] Kể được 7 nguyên tắc và sai lầm tương ứng mỗi cái ngăn chặn
- [ ] Tìm được ví dụ thực tế cho ít nhất 4 nguyên tắc

---

## Module 1.5 — SDLC và vai trò QA trong từng mô hình

`🏷️ NỀN TẢNG` `⏱️ 2 giờ` `🔗 Module 1.1`

### 📘 Nội dung

SDLC (Software Development Life Cycle) = quy trình phát triển phần mềm. Vai trò QA THAY ĐỔI tùy mô hình. Bạn không cần thành expert về methodology — chỉ cần hiểu QA fit vào đâu.

**Waterfall — tuần tự, từng phase:**
```
Requirements → Design → Development → Testing → Deployment → Maintenance
                                        ↑
                                   QA vào ĐÂY (cuối)
```
- QA chỉ test SAU KHI dev xong toàn bộ
- Rủi ro: tìm lỗi requirement ở giai đoạn test → phải quay lại từ đầu, rất đắt
- Vẫn dùng: dự án government, medical device, nơi requirement ít thay đổi

**V-Model — mỗi phase dev có phase test tương ứng:**
```
Requirements ────────────── Acceptance Testing
    Design ──────────────── System Testing
        Architecture ────── Integration Testing
            Coding ──────── Unit Testing
```
- QA viết test plan SONG SONG với dev từng giai đoạn
- Tốt hơn Waterfall vì test được lên kế hoạch sớm
- Nhưng vẫn sequential — test execution vẫn ở cuối

**Agile/Scrum — iterative, QA trong sprint:**
```
Sprint 1 (2 tuần):
  [Plan] → [Dev + QA viết test] → [Test] → [Demo] → [Retro]
Sprint 2 (2 tuần):
  [Plan] → [Dev + QA viết test] → [Test] → [Demo] → [Retro]
...
```
- QA là thành viên sprint team, tham gia TẤT CẢ ceremonies:
  - **Sprint Planning:** QA hỏi câu hỏi làm rõ requirement, estimate effort test
  - **Daily Standup:** QA report tiến độ test, blocker
  - **Sprint Review:** QA demo test results, bug status
  - **Retrospective:** QA đóng góp cách cải thiện process
- QA viết test case NGAY KHI story được groom, không đợi dev xong
- Test trong sprint: story dev xong → QA test ngay → feedback nhanh

**Definition of Done (DoD) trong Agile** — QA đóng vai trò quan trọng:
```
Một story được coi là "Done" khi:
☐ Code reviewed
☐ Unit test pass
☐ QA test pass (tất cả test case)    ← QA verify
☐ No open critical/major bugs         ← QA verify
☐ Documentation updated
☐ Deployed to staging
```

**Kanban — continuous flow:**
- Không có sprint cố định — task flow liên tục qua các cột: To Do → In Progress → Testing → Done
- QA test ngay khi task chuyển sang cột Testing
- WIP limit: giới hạn số task trong mỗi cột → tránh QA bị overwhelm

💡 **Phần lớn công ty tech hiện tại dùng Agile/Scrum hoặc Kanban.** Nắm vững QA trong Agile là đủ cho thực tế. Waterfall/V-Model biết để hiểu lịch sử và so sánh.

### ✅ Tiêu chí hoàn thành

- [ ] Mô tả được vai trò QA trong Agile sprint (tham gia ceremonies nào, làm gì khi nào)
- [ ] Hiểu tại sao Agile tốt hơn Waterfall cho QA (feedback loop ngắn, tìm lỗi sớm)
- [ ] Biết Definition of Done là gì và QA contribute gì vào đó

---

# PHẦN II — KỸ NĂNG LÕI: TEST DESIGN & BUG MANAGEMENT

> Phần này trả lời câu hỏi: "Làm sao viết test case tốt, và xử lý bug hiệu quả?"
> Đây là kỹ năng bạn sẽ DÙNG HÀNG NGÀY cho dù manual hay automation.

---

## Module 2.1 — Viết test case đúng chuẩn

`🏷️ CỐT LÕI` `⏱️ 3-4 giờ` `🔗 Module 1.3`

### 📘 Nội dung

**Test Scenario vs Test Case:**
- **Test Scenario** = mô tả HIGH-LEVEL, 1 dòng: "Verify user can reset password via email"
- **Test Case** = chi tiết step-by-step, REPRODUCE được: ai cũng đọc và chạy được giống nhau

**Cấu trúc test case chuẩn:**

| Field | Mô tả | Ví dụ |
|---|---|---|
| **Test Case ID** | Mã định danh duy nhất | TC-REG-001 |
| **Title** | Mô tả ngắn, rõ ràng | Verify registration with valid data |
| **Module** | Feature/module nào | Registration |
| **Priority** | High / Medium / Low | High |
| **Type** | Positive / Negative | Positive |
| **Precondition** | Điều kiện cần có TRƯỚC khi test | User chưa có account, email "test@mail.com" chưa tồn tại |
| **Test Data** | Dữ liệu cụ thể dùng để test | Name: "Nguyen Van A", Email: "test@mail.com", Password: "Test@123" |
| **Steps** | Từng bước cụ thể | 1. Mở /register 2. Nhập Name 3. Nhập Email 4. Nhập Password 5. Click "Register" |
| **Expected Result** | Kết quả đúng phải xảy ra | Redirect to /login, hiện message "Registration successful", nhận email confirmation |
| **Actual Result** | Kết quả thật khi chạy (để trống khi viết, điền khi execute) | (điền khi test) |
| **Status** | Pass / Fail / Blocked / Skipped | (điền khi test) |

**Nguyên tắc viết test case tốt:**

1. **Atomic:** 1 test case test 1 thứ duy nhất. Không gộp "test login + test dashboard + test logout" vào 1 case.

2. **Independent:** test case A không phụ thuộc test case B. Nếu cần login trước khi test feature X → ghi "Precondition: user already logged in" chứ không viết "Run TC-001 first".

3. **Repeatable:** ai đọc cũng chạy được giống nhau, chạy lần nào cũng cùng kết quả (trên cùng môi trường).

4. **Clear Expected Result:** expected result phải CHUẨN XÁC, không mơ hồ.
   - ❌ "Hiển thị thông báo thành công" (thông báo gì? Ở đâu?)
   - ✅ "Hiện toast notification phía trên cùng, nội dung 'Registration successful. Please check your email.', tự biến mất sau 5 giây"

5. **Có đủ Test Data:** đừng viết "nhập email hợp lệ" — viết cụ thể "nhập email: test@mail.com". Người khác chạy test không cần đoán.

### 🔧 Bài tập

Chọn 1 feature trong webapp của bạn (gợi ý: form đăng ký hoặc trang quản lý sản phẩm). Viết 15 test cases theo đúng format trên, bao gồm:
- 5 positive cases (happy path)
- 7 negative cases (invalid input, empty fields, duplicate data...)
- 3 boundary cases (min/max length, edge values)

Lưu vào file `/qa/exercises/test-cases-registration.md`

### ✅ Tiêu chí hoàn thành

- [ ] Viết được test case đúng format, đủ field
- [ ] Người khác đọc test case của bạn có thể chạy mà không cần hỏi thêm
- [ ] Phân biệt rõ precondition, test data, steps, expected result

---

## Module 2.2 — Test Design Techniques (kỹ thuật chọn test case thông minh)

`🏷️ CỐT LÕI` `⏱️ 4-5 giờ` `🔗 Module 2.1`

### 📘 Nội dung

Vấn đề: exhaustive testing is impossible (nguyên tắc 2). Vậy chọn test case NÀO để cover tốt nhất với ít nhất effort? Đây là câu hỏi test design techniques trả lời.

### Technique 1: Equivalence Partitioning (EP)

**Ý tưởng:** chia tập input thành các nhóm (partition) — các giá trị trong cùng nhóm được hệ thống xử lý GIỐNG NHAU → chỉ cần test 1 giá trị đại diện mỗi nhóm.

**Ví dụ: field "Tuổi" chấp nhận 18-65**

```
Invalid (< 18)          Valid (18-65)         Invalid (> 65)
─────────────────────────────────────────────────────────────
     [10]                    [30]                  [70]
  (đại diện)             (đại diện)            (đại diện)
```

3 partitions → 3 test cases thay vì test 0, 1, 2, ..., 100.

**Ví dụ phức tạp hơn: field "Mã giảm giá"**
- Partition 1: mã hợp lệ, chưa hết hạn → áp dụng giảm giá ✅
- Partition 2: mã hợp lệ, đã hết hạn → báo lỗi "Expired" ❌
- Partition 3: mã không tồn tại → báo lỗi "Invalid code" ❌
- Partition 4: mã đã sử dụng (1 lần) → báo lỗi "Already used" ❌
- Partition 5: để trống → không áp dụng, tính giá gốc

5 partitions → 5 test cases cover hết tất cả trường hợp.

### Technique 2: Boundary Value Analysis (BVA)

**Ý tưởng:** lỗi thường xảy ra ở BIÊN (ranh giới) của partition — nơi điều kiện chuyển từ valid ↔ invalid. Test chính xác tại biên.

**Ví dụ: field "Tuổi" chấp nhận 18-65**

```
  Invalid │ Valid              Valid │ Invalid
          │                         │
    17    18    19    ...    64    65    66
     ↑     ↑     ↑           ↑     ↑     ↑
   test  test  test        test  test  test
```

Mẹo: **min-1, min, min+1, max-1, max, max+1** = 6 test values.

Kết hợp với EP: thay vì chỉ test 1 giá trị đại diện mỗi partition, thêm test ở biên.

**Ví dụ: field "Password" 8-20 ký tự**
- BVA values: 7 ký tự (reject), 8 (accept), 9 (accept), 19 (accept), 20 (accept), 21 (reject)
- Mỗi value = 1 test case

### Technique 3: Decision Table Testing

**Ý tưởng:** khi kết quả phụ thuộc vào NHIỀU ĐIỀU KIỆN kết hợp → liệt kê tất cả tổ hợp bằng bảng.

**Ví dụ: Login form**

| Rule | Email valid? | Password valid? | Account active? | Kết quả |
|---|---|---|---|---|
| R1 | ✅ | ✅ | ✅ | Login thành công |
| R2 | ✅ | ✅ | ❌ | "Account suspended" |
| R3 | ✅ | ❌ | ✅ | "Wrong password" |
| R4 | ✅ | ❌ | ❌ | "Wrong password" (check password trước account) |
| R5 | ❌ | ✅ | - | "Email not found" |
| R6 | ❌ | ❌ | - | "Email not found" (check email trước) |

Mỗi dòng = 1 test case. Bảng đảm bảo không sót tổ hợp nào.

💡 **Khi nào dùng:** khi có 2-4 điều kiện boolean ảnh hưởng đến output. Nếu > 4 điều kiện → quá nhiều tổ hợp, dùng Pairwise thay thế.

### Technique 4: State Transition Testing

**Ý tưởng:** hệ thống có các trạng thái (state) và chuyển đổi (transition) giữa chúng. Test tất cả transition HỢP LỆ + các transition KHÔNG HỢP LỆ.

**Ví dụ: Trạng thái đơn hàng**
```
               cancel
         ┌──────────────┐
         │              ▼
  [Draft] ──submit──▶ [Submitted] ──approve──▶ [Approved] ──ship──▶ [Shipped] ──deliver──▶ [Delivered]
                          │                                              │
                          │ reject                                       │ return
                          ▼                                              ▼
                      [Rejected]                                     [Returned]
```

Test cases:
- Mỗi transition HỢP LỆ: Draft→Submitted, Submitted→Approved, Submitted→Rejected, ...
- Các transition KHÔNG HỢP LỆ: Draft→Shipped? Delivered→Draft? → hệ thống phải reject
- Mỗi state: ở state này, action nào được phép, action nào không?

### Technique 5: Pairwise Testing

**Ý tưởng:** khi có NHIỀU biến (OS, browser, resolution, language...) → test tất cả tổ hợp quá lớn. Pairwise chỉ cần cover tất cả CẶP ĐÔI → giảm số case ~80-90% mà vẫn tìm được phần lớn bug.

**Ví dụ:**
- OS: Windows, macOS, Linux (3)
- Browser: Chrome, Firefox, Safari (3)
- Resolution: 1920×1080, 1366×768, 375×812 (3)
- 3×3×3 = 27 tổ hợp đầy đủ

Pairwise giảm còn ~9-12 test cases, vẫn cover tất cả cặp: (Windows, Chrome), (Windows, Firefox), (macOS, Chrome), ...

Tool: [PICT (Microsoft)](https://github.com/microsoft/pict) — input danh sách biến + giá trị → output pairwise test set.

### Technique 6: Error Guessing

**Ý tưởng:** dùng kinh nghiệm + trực giác đoán chỗ hay lỗi. Không formal nhưng bổ sung tốt cho các kỹ thuật trên.

**Checklist phổ biến:**
- Nhập rỗng (empty string)
- Nhập toàn space
- Nhập quá dài (overflow)
- Ký tự đặc biệt: `<script>alert(1)</script>`, `'; DROP TABLE users;--`
- Số âm, số 0, số rất lớn
- Emoji: 😀🎉
- Unicode: tên tiếng Việt có dấu "Nguyễn Văn Ả"
- Double submit (click nhanh 2 lần)
- Back button sau submit
- Refresh page giữa chừng
- Concurrent access (2 user edit cùng record)
- Timezone khác nhau
- File upload: file quá lớn, file sai format, file rỗng, file có tên đặc biệt

### 🔧 Bài tập

**Bài 1 (EP + BVA):** Cho form tạo sản phẩm với fields:
- Product Name: 3-100 ký tự, bắt buộc
- Price: 1,000 - 999,999,999 VND, bắt buộc
- Quantity: 0-9999, bắt buộc
- Description: 0-5000 ký tự, không bắt buộc

Liệt kê Equivalence Partitions và Boundary Values cho TỪNG field. Viết test cases.

**Bài 2 (Decision Table):** Feature "Áp dụng voucher":
- Điều kiện: (Voucher hợp lệ?) × (Đơn hàng ≥ minimum?) × (Voucher chưa hết lượt?)
- Vẽ decision table đầy đủ, viết test case cho mỗi rule.

**Bài 3 (State Transition):** Vẽ state diagram cho quy trình đăng ký tài khoản:
- States: Chưa đăng ký → Đã submit form → Email sent → Email verified → Active
- Thêm: Expired (link xác nhận hết hạn), Suspended, Deleted
- Liệt kê tất cả transition hợp lệ + test 3 transition không hợp lệ

### ✅ Tiêu chí hoàn thành

- [ ] Áp dụng được EP + BVA cho bất kỳ field input nào
- [ ] Vẽ được decision table cho feature có 2-4 điều kiện
- [ ] Vẽ được state diagram và liệt kê test cases cho transitions
- [ ] Biết khi nào dùng technique nào (EP cho values, Decision Table cho combinations, State cho workflows)

---

## Module 2.3 — Bug Lifecycle & Bug Report

`🏷️ CỐT LÕI` `⏱️ 3 giờ` `🔗 Module 2.1`

### 📘 Nội dung

**Bug Life Cycle — vòng đời của 1 bug từ khi phát hiện đến khi close:**

```
  QA tìm bug
      │
      ▼
   [NEW] ──── PM/Lead review ────▶ [REJECTED] (không phải bug / by design)
      │                                 
      │ assign to dev                  
      ▼                           
   [OPEN] ──── dev nhận ────▶ [IN PROGRESS] ──── dev sửa xong ────▶ [FIXED]
      │                                                                 │
      │ defer                                                     QA re-test
      ▼                                                                 │
   [DEFERRED]                                        ┌──────────────────┤
   (sửa sau)                                         │                  │
                                                     ▼                  ▼
                                                 [VERIFIED]        [REOPENED]
                                                  (close ✅)     (lỗi chưa hết,
                                                                  quay lại dev)
```

**Mỗi transition cần ghi rõ:**
- **Ai** chuyển trạng thái
- **Khi nào** (timestamp)
- **Lý do** (nếu reject/defer: tại sao?)
- **Comment** (thông tin bổ sung)

**Severity vs Priority — hai trục đánh giá bug:**

Severity = **mức độ ảnh hưởng kỹ thuật** (do QA đánh giá):
| Level | Mô tả | Ví dụ |
|---|---|---|
| **Critical** | System crash, data loss, security breach | App crash khi submit form, mất data user, SQL injection |
| **Major** | Feature chính không hoạt động, không có workaround | Không thể checkout, payment fail |
| **Minor** | Feature phụ lỗi, có workaround | Filter không hoạt động nhưng có thể search thay thế |
| **Trivial** | Cosmetic, không ảnh hưởng chức năng | Typo, icon lệch 2px, font sai |

Priority = **mức độ cấp bách cần sửa** (do PM/PO quyết định):
| Level | Mô tả |
|---|---|
| **Urgent** | Sửa ngay, block release |
| **High** | Sửa trong sprint này |
| **Medium** | Sửa sprint tới |
| **Low** | Backlog, sửa khi có thời gian |

💡 **Severity ≠ Priority — ví dụ thực tế:**

| Tình huống | Severity | Priority | Giải thích |
|---|---|---|---|
| App crash khi nhập emoji vào field "Ghi chú nội bộ" (ít dùng) | Critical | Low | Crash nặng nhưng rất ít user gặp, field này optional |
| Logo công ty hiển thị sai trên homepage | Trivial | Urgent | Chỉ là cosmetic nhưng ảnh hưởng brand trước hàng triệu visitors |
| Trang admin load chậm 10 giây | Major | Medium | Ảnh hưởng lớn nhưng chỉ ảnh hưởng internal team, không ảnh hưởng end user |
| Nút "Mua ngay" không click được trên Safari | Critical | Urgent | Feature chính bị chết trên browser phổ biến |

**Viết Bug Report tốt:**

Bug report tốt = dev đọc xong, reproduce được trong 5 phút, không cần hỏi thêm.

```markdown
## [Checkout] Error 500 khi áp dụng voucher quá giới hạn sử dụng

**Environment:** Chrome 126 / macOS 15.2 / Staging (staging.app.com)
**Severity:** Major | **Priority:** High
**Found in:** Build #1234 (2026-08-01)

### Precondition
- User đã login, có sản phẩm trong giỏ hàng
- Voucher "SALE50" đã được sử dụng 100/100 lượt (hết lượt)

### Steps to Reproduce
1. Vào trang /checkout
2. Nhập mã voucher "SALE50" vào field "Discount Code"
3. Click "Apply"

### Expected Result
Hiển thị thông báo: "This voucher has reached its usage limit"
Giá đơn hàng không thay đổi

### Actual Result
Trang trắng, console hiện: "Unhandled Error: Cannot read property 'discount' of null"
Network tab: POST /api/voucher/apply trả 500 Internal Server Error

### Attachments
- screenshot_error.png
- console_log.txt
- network_response.har

### Additional Notes
- Voucher "SALE50" khi còn lượt → hoạt động bình thường
- Thử với voucher hết hạn (khác hết lượt) → hiện message đúng
- → Bug chỉ xảy ra khi voucher hết LƯỢT, không phải hết HẠN
```

**Best practices:**
- Title: `[Module] Mô tả ngắn, cụ thể` — không viết "Checkout lỗi"
- Steps phải đủ chi tiết để BẤT KỲ AI đọc cũng reproduce được
- Ghi rõ environment — bug có thể browser/OS-specific
- Đính kèm evidence: screenshot, video, console log, network log
- Additional Notes: thông tin debug bạn đã tìm — giúp dev narrowing down root cause nhanh hơn
- 1 bug = 1 report — không gộp nhiều bug vào 1 ticket

### 🔧 Bài tập

1. Dùng webapp của bạn (hoặc bất kỳ web app nào), tìm 2 bug thật (dù nhỏ) và viết bug report theo format trên.
2. Tự đánh giá Severity và Priority cho mỗi bug. Giải thích tại sao chọn level đó.
3. Đưa bug report cho 1 người khác đọc (dev friend) — họ có reproduce được không?

### ✅ Tiêu chí hoàn thành

- [ ] Vẽ được bug lifecycle flow
- [ ] Phân biệt severity vs priority, cho được ví dụ mỗi tổ hợp
- [ ] Viết được bug report mà dev đọc xong reproduce được ngay

---

## Module 2.4 — Test Planning & Traceability

`🏷️ CỐT LÕI` `⏱️ 2 giờ` `🔗 Module 2.1, 2.2, 2.3`

### 📘 Nội dung

**Test Plan — tài liệu tổng quan cho việc test:**

Test plan trả lời: Test CÁI GÌ, AI test, KHI NÀO, DÙNG GÌ, KHI NÀO bắt đầu/kết thúc.

Một test plan cơ bản gồm:

| Section | Nội dung | Ví dụ |
|---|---|---|
| **Scope** | Test cái gì, KHÔNG test cái gì | In scope: Login, Registration, Checkout. Out of scope: Admin panel (sprint sau) |
| **Test Strategy** | Approach dùng (manual? automation? cả hai?) | Manual testing cho new features, automation cho regression |
| **Entry Criteria** | Điều kiện để BẮT ĐẦU test | Code deployed lên staging, smoke test pass, test data ready |
| **Exit Criteria** | Điều kiện để KẾT THÚC test | 100% critical test pass, 95% total pass, no open critical bugs |
| **Resources** | Ai test, dùng tool gì | QA: 2 người. Tools: Playwright, Postman, TestRail |
| **Schedule** | Timeline | Test cycle: 5 ngày (3 ngày execute, 1 ngày regression, 1 ngày buffer) |
| **Risk & Mitigation** | Rủi ro và cách xử lý | Risk: staging env không stable → Mitigation: dùng local env backup |

**Entry Criteria vs Exit Criteria:**

- **Entry Criteria** = "điều kiện để BẮT ĐẦU test". Nếu entry criteria chưa đạt → chưa bắt đầu test (ví dụ: code chưa deploy, test data chưa sẵn sàng).
- **Exit Criteria** = "điều kiện để nói TEST XONG". Giúp team biết khi nào đủ confident để release.

💡 **Trong thực tế Agile:** test plan thường không phải tài liệu dài 20 trang — mà là 1-2 trang checklist ngắn gọn cho mỗi sprint/release. Quan trọng là có entry/exit criteria rõ ràng.

**Requirement Traceability Matrix (RTM):**

RTM = bảng mapping: Requirement → Test Case → Bug. Đảm bảo mọi requirement đều có test case cover.

| Req ID | Requirement | Test Cases | Test Status | Bugs |
|---|---|---|---|---|
| REQ-001 | User đăng ký bằng email | TC-001, TC-002, TC-003, TC-004 | 3 Pass, 1 Fail | BUG-012 |
| REQ-002 | User login bằng email + password | TC-010, TC-011, TC-012 | All Pass | — |
| REQ-003 | User reset password qua email | TC-020 | Not tested | — |
| REQ-004 | User update profile | (chưa viết test case) | — | — |

Nhìn RTM → thấy ngay:
- REQ-003: mới test 1 case, cần thêm negative/edge cases
- REQ-004: chưa có test case → gap!

### ✅ Tiêu chí hoàn thành

- [ ] Biết các section chính của test plan
- [ ] Hiểu entry/exit criteria và tại sao quan trọng
- [ ] Tạo được RTM đơn giản cho 1 feature

---

# PHẦN III — KỸ THUẬT NỀN CHO QA

> Phần này bạn đã có 70-80% từ nền tảng dev.
> Focus: nhìn lại kiến thức cũ qua "kính QA" + bổ sung API testing & SQL verification.

---

## Module 3.1 — Web Fundamentals qua lens QA

`🏷️ CỐT LÕI` `⏱️ 2 giờ` `🔗 Module 1.2` `💡 Bạn đã biết ~80%`

### 📘 Nội dung

Bạn đã biết HTML/CSS/JS, Next.js (SSR/CSR), DevTools. Module này chỉ highlight **góc nhìn QA khác dev** cho những kiến thức bạn đã có.

**Browser DevTools — QA dùng khác dev:**

| Tab | Dev dùng để | QA dùng để |
|---|---|---|
| **Console** | Debug code | Phát hiện JS errors user không thấy (red errors = bug tiềm ẩn) |
| **Network** | Debug API calls | Verify: đúng endpoint? đúng status code? response time chấp nhận? Payload có leak sensitive data? |
| **Application** | Manage storage | Verify: session/token lưu đúng? Cookie flags correct (HttpOnly, Secure)? |
| **Performance** | Profile renders | Tìm jank/freeze khi scroll, click — ảnh hưởng UX |
| **Lighthouse** | Optimize score | Audit accessibility, performance, SEO — biết metric pass/fail |

**SSR vs CSR — QA cần biết vì sao:**
- **Hydration bug (SSR):** server render HTML → gửi client → React "hydrate" (gắn event handlers). Nếu server render khác client render → UI flicker/crash. QA cần test: page load → có flicker không? Buttons có clickable ngay không hay phải đợi?
- **Timing issue (CSR):** data fetch từ API → loading state → render. Automation test phải wait cho data load xong trước khi assert. Hard wait (`sleep(3)`) = anti-pattern → dùng explicit wait.
- **SEO difference:** SSR pages có content trong HTML source → Google crawl được. CSR pages cần JS execute → khó crawl. QA cần verify "View Page Source" có content (SSR) hay chỉ có `<div id="root"></div>` (CSR).

**Caching — nguồn bug phổ biến QA hay gặp:**
- "Tôi đã update data trên backend, nhưng frontend vẫn hiển thị data cũ" → cache
- Layers: Browser cache → CDN cache → API cache → DB cache
- QA test checklist: update data → refresh (vẫn cũ?) → hard refresh Ctrl+Shift+R (vẫn cũ?) → clear cache (update chưa?) → incognito mode (update chưa?)
- Nếu incognito mode hiển thị data mới nhưng normal mode vẫn cũ → bug cache, không phải bug logic

### ✅ Tiêu chí hoàn thành

- [ ] Mở DevTools Console trên webapp, tìm xem có JS error nào không
- [ ] Mở Network tab, thực hiện 1 action, verify API response status + payload
- [ ] Hiểu tại sao caching gây "false bug" và cách isolate

---

## Module 3.2 — API Testing Fundamentals

`🏷️ CỐT LÕI` `⏱️ 3-4 giờ` `🔗 Module 3.1`

### 📘 Nội dung

API testing = test backend trực tiếp, không qua UI. Tại sao quan trọng:
- Tìm bug sớm hơn (không cần đợi UI dev xong)
- Nhanh hơn UI test (milliseconds vs seconds)
- Cover cases mà UI không expose (VD: gửi request với field mà UI không có)

**HTTP Methods — QA cần verify dùng đúng method:**

| Method | Purpose | Idempotent? | Safe? | QA check |
|---|---|---|---|---|
| GET | Đọc data | ✅ | ✅ | Gọi GET nhiều lần → cùng kết quả? Không tạo/sửa data? |
| POST | Tạo mới | ❌ | ❌ | Gọi POST 2 lần → tạo 2 records (không phải 1)? |
| PUT | Update toàn bộ | ✅ | ❌ | Gọi PUT nhiều lần → kết quả cuối cùng giống nhau? |
| PATCH | Update 1 phần | ❌ | ❌ | Chỉ update field gửi, không xóa field khác? |
| DELETE | Xóa | ✅ | ❌ | Gọi DELETE 2 lần → lần 2 trả 404 (đã xóa)? |

**HTTP Status Codes — QA verify trả đúng code:**
```
2xx = Success       → API hoạt động đúng
  200 OK            → Request thành công, có data trả về
  201 Created       → POST thành công, resource mới được tạo
  204 No Content    → Thành công nhưng không có body (thường DELETE)

4xx = Client Error  → Client gửi sai → API phải từ chối VÀ báo lỗi rõ ràng
  400 Bad Request   → Request sai format/thiếu field
  401 Unauthorized  → Chưa authenticate (chưa login/token hết hạn)
  403 Forbidden     → Đã authenticate nhưng không có QUYỀN
  404 Not Found     → Resource không tồn tại
  409 Conflict      → Conflict (VD: email đã tồn tại khi register)
  422 Unprocessable → Validation fail (format đúng nhưng data không hợp lệ)
  429 Too Many Req  → Rate limit exceeded

5xx = Server Error  → Backend lỗi → LUÔN LÀ BUG (trừ khi server overload thật)
  500 Internal Error → Code lỗi, unhandled exception
  502 Bad Gateway   → Proxy/load balancer không connect được backend
  503 Unavailable   → Server quá tải hoặc đang maintenance
```

💡 **QA rule of thumb:** 
- Nếu client gửi sai → API phải trả 4xx (KHÔNG phải 500). Trả 500 cho client error = bug.
- Nếu API trả 200 nhưng body có `{ "error": true }` = design smell, nên trả proper status code.

**API Testing Checklist:**
- [ ] **Status code đúng** cho mỗi scenario (happy path + error cases)
- [ ] **Response body đúng format** (JSON schema validation)
- [ ] **Response time** chấp nhận được (< 200ms cho simple query, < 1s cho complex)
- [ ] **Error response** rõ ràng, không leak stack trace/internal info
- [ ] **Auth/Authz:** API yêu cầu auth → gọi không có token → 401? Gọi với token khác role → 403?
- [ ] **Validation:** gửi data invalid → trả 400/422 với message rõ ràng?
- [ ] **Pagination:** large dataset → pagination hoạt động đúng? Page 0? Page vượt quá?
- [ ] **CORS:** frontend domain khác backend → headers đúng?
- [ ] **Rate limiting:** gửi 100 requests/giây → trả 429?

### 🔧 Bài tập

1. Cài Postman (hoặc dùng `curl`). Gọi API của webapp Next.js/NestJS bạn đang có:
   - GET endpoint: verify status 200, response format
   - POST endpoint: tạo data, verify 201
   - POST endpoint với data invalid: verify 400/422
   - GET endpoint không có auth token: verify 401
   - DELETE endpoint: verify 200/204, gọi lại verify 404

2. Tìm 1 public API (VD: `https://jsonplaceholder.typicode.com/`) và thực hành test checklist ở trên.

### ✅ Tiêu chí hoàn thành

- [ ] Gọi API bằng Postman/curl và đọc hiểu response
- [ ] Verify đúng status code cho happy path + error cases
- [ ] Tìm được ít nhất 1 API bug (VD: trả 500 thay vì 400 cho invalid input)

---

## Module 3.3 — Database & SQL cho QA

`🏷️ CỐT LÕI` `⏱️ 2 giờ` `🔗 Module 3.2`

### 📘 Nội dung

QA không cần viết complex SQL — nhưng cần đủ để **verify data** sau khi UI/API action.

**Khi nào QA cần query DB:**
1. **Verify data integrity:** UI hiện "Đã tạo thành công" → check DB xem record có thật không, data có đúng không
2. **Debug:** UI hiển thị sai → check DB data đúng không → isolate bug frontend hay backend
3. **Test data setup:** tạo data specific cho test scenario (VD: tạo user với status = "suspended")
4. **Check side effects:** xóa 1 order → check related records (order_items, payment) có bị cascade delete đúng không

**SQL cơ bản cho QA:**

```sql
-- 1. Verify data vừa tạo
SELECT * FROM users WHERE email = 'test@mail.com';

-- 2. Check data đúng sau update
SELECT name, email, updated_at FROM users WHERE id = 123;

-- 3. Đếm records (verify pagination, filtering)
SELECT COUNT(*) FROM products WHERE category = 'electronics' AND price > 100000;

-- 4. Check duplicate (data integrity)
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- 5. Check cascade delete
SELECT * FROM order_items WHERE order_id = 456;
-- Nếu order 456 đã bị xóa, order_items cũng phải bị xóa (nếu cascade)

-- 6. Check data ordering
SELECT * FROM products ORDER BY created_at DESC LIMIT 10;
-- Verify UI hiển thị đúng thứ tự

-- 7. Check foreign key integrity
SELECT o.id, o.user_id
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE u.id IS NULL;
-- Nếu có kết quả → orphan records = data integrity bug
```

### ✅ Tiêu chí hoàn thành

- [ ] Query được DB để verify data sau khi test UI action
- [ ] Biết khi nào cần check DB (không chỉ tin UI)
- [ ] Tìm được 1 data integrity issue bằng SQL

---

# PHẦN IV — AUTOMATION TESTING

> Phần này chuyển từ "test thủ công" sang "test tự động".
> Playwright là trọng tâm. Học sâu, thực hành nhiều.

---

## Module 4.1 — Automation Strategy: test gì nên automate?

`🏷️ CỐT LÕI` `⏱️ 2 giờ` `🔗 Module 2.1, 2.2`

### 📘 Nội dung

**Test Automation Pyramid:**

```
          /    E2E/UI Tests    \          10%  Chậm, đắt, dễ flaky
         /  Integration Tests   \        20%  Vừa phải
        /     Unit Tests         \       70%  Nhanh, rẻ, stable
       ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
```

**NÊN automate:**
- Regression tests (chạy lại hàng trăm lần)
- Smoke tests (chạy sau mỗi build)
- Data-driven tests (cùng logic, nhiều bộ data)
- Cross-browser/cross-device tests

**KHÔNG NÊN automate:**
- Exploratory testing (cần sáng tạo con người)
- Test chỉ chạy 1 lần
- UI đang thay đổi liên tục (test bị broken liên tục, maintenance cost > value)
- Usability testing (cần judgment con người)

**ROI of automation:** Automation tốn effort ban đầu (viết test + setup) nhưng tiết kiệm dài hạn. Rule of thumb: nếu test case cần chạy > 5 lần → nên automate.

### ✅ Tiêu chí hoàn thành

- [ ] Giải thích được test automation pyramid
- [ ] Quyết định được test case nào nên/không nên automate và tại sao

---

## Module 4.2 — Playwright Core

`🏷️ CỐT LÕI` `⏱️ 5-6 giờ` `🔗 Module 4.1`

### 📘 Nội dung

Phần này dài — break thành sub-modules:

**4.2a — Setup & First Test**
```bash
# Tạo project mới
npm init playwright@latest
# Chọn: TypeScript, tests folder, GitHub Actions workflow, install browsers
```

```typescript
// tests/example.spec.ts — test đầu tiên
import { test, expect } from '@playwright/test';

test('homepage has correct title', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await expect(page).toHaveTitle(/My App/);
});
```

```bash
# Chạy test
npx playwright test                    # chạy tất cả
npx playwright test --headed           # mở browser thật
npx playwright test --ui               # interactive UI mode
npx playwright test --debug            # debug step-by-step
```

**4.2b — Locators (cách tìm element trên page)**

Ưu tiên theo thứ tự (accessible → stable → brittle):
```typescript
// 🥇 Tốt nhất: role-based (accessible, stable)
page.getByRole('button', { name: 'Submit' })
page.getByRole('textbox', { name: 'Email' })
page.getByRole('link', { name: 'Home' })

// 🥈 Tốt: text/label-based
page.getByLabel('Email address')
page.getByPlaceholder('Enter your email')
page.getByText('Welcome back')

// 🥉 OK: test-id (stable nhưng không semantic)
page.getByTestId('login-button')

// ❌ Tránh: CSS selector, XPath (brittle, dễ break khi UI thay đổi)
page.locator('.btn-primary.submit-form')
page.locator('//div[@class="container"]/form/button[2]')
```

**4.2c — Actions (tương tác với page)**
```typescript
// Click
await page.getByRole('button', { name: 'Login' }).click();
await page.getByRole('link', { name: 'Register' }).click();

// Fill (clear + type)
await page.getByLabel('Email').fill('test@mail.com');

// Type (từng ký tự, simulate keyboard)
await page.getByLabel('Search').pressSequentially('hello', { delay: 100 });

// Select dropdown
await page.getByLabel('Country').selectOption('Vietnam');

// Check/uncheck
await page.getByLabel('Terms').check();

// Upload file
await page.getByLabel('Avatar').setInputFiles('test-files/photo.jpg');

// Keyboard shortcuts
await page.keyboard.press('Enter');
await page.keyboard.press('Control+A');
```

**4.2d — Assertions (kiểm tra kết quả)**
```typescript
// Page-level
await expect(page).toHaveTitle('Dashboard');
await expect(page).toHaveURL('/dashboard');

// Element visibility
await expect(page.getByText('Welcome')).toBeVisible();
await expect(page.getByText('Error')).toBeHidden();

// Text content
await expect(page.getByRole('heading')).toHaveText('Dashboard');
await expect(page.getByRole('alert')).toContainText('success');

// Count
await expect(page.getByRole('listitem')).toHaveCount(5);

// Attribute
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).toBeDisabled();

// Input value
await expect(page.getByLabel('Email')).toHaveValue('test@mail.com');
```

**4.2e — Auto-waiting & Smart Waits**

Playwright tự đợi element actionable trước khi interact — đây là lý do Playwright ít flaky hơn Selenium.

```typescript
// ✅ Playwright tự wait cho element visible + enabled trước khi click
await page.getByRole('button', { name: 'Submit' }).click();

// ✅ Wait for navigation
await page.waitForURL('/dashboard');

// ✅ Wait for API response
const responsePromise = page.waitForResponse(resp =>
  resp.url().includes('/api/login') && resp.status() === 200
);
await page.getByRole('button', { name: 'Login' }).click();
const response = await responsePromise;

// ✅ Wait for element
await page.getByText('Loading...').waitFor({ state: 'hidden' });

// ❌ TRÁNH: hard wait — flaky + chậm
await page.waitForTimeout(3000);
```

### 🔧 Bài tập

1. Init Playwright project trong thư mục qa: `/qa/playwright-tests/`
2. Viết 5 test cases cho trang web bạn hay dùng (hoặc https://demo.playwright.dev/todomvc):
   - Test 1: Navigate to page, verify title
   - Test 2: Add a todo item, verify it appears
   - Test 3: Complete a todo, verify strikethrough
   - Test 4: Filter completed todos
   - Test 5: Delete a todo, verify count

### ✅ Tiêu chí hoàn thành

- [ ] Chạy được Playwright test thành công
- [ ] Dùng được role-based locators (không dùng CSS selector)
- [ ] Dùng được smart waits (không dùng waitForTimeout)
- [ ] Viết được ít nhất 5 test cases

---

## Module 4.3 — Page Object Model & Test Organization

`🏷️ CỐT LÕI` `⏱️ 3-4 giờ` `🔗 Module 4.2`

### 📘 Nội dung

**Vấn đề:** khi có 50 test files, nếu button "Login" đổi text thành "Sign In" → sửa 50 files? Không.

**POM = tách biệt "tìm element" khỏi "logic test":**

```typescript
// pages/login.page.ts — Page Object
import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly forgotPasswordLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel('Password');
    this.submitButton = page.getByRole('button', { name: 'Login' });
    this.errorAlert = page.getByRole('alert');
    this.forgotPasswordLink = page.getByRole('link', { name: 'Forgot password' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async expectError(message: string) {
    await expect(this.errorAlert).toContainText(message);
  }

  async expectLoginSuccess() {
    await expect(this.page).toHaveURL('/dashboard');
  }
}
```

```typescript
// tests/login.spec.ts — Test file (clean, readable)
import { test } from '@playwright/test';
import { LoginPage } from '../pages/login.page';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('successful login with valid credentials', async () => {
    await loginPage.login('user@test.com', 'Password123!');
    await loginPage.expectLoginSuccess();
  });

  test('shows error for wrong password', async () => {
    await loginPage.login('user@test.com', 'wrongpassword');
    await loginPage.expectError('Invalid credentials');
  });

  test('shows error for empty email', async () => {
    await loginPage.login('', 'Password123!');
    await loginPage.expectError('Email is required');
  });
});
```

**Khi button đổi text "Login" → "Sign In":** chỉ sửa 1 dòng trong `login.page.ts`, tất cả 50 test files vẫn chạy đúng.

**Project structure:**
```
tests/
├── pages/                 ← Page Objects
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── dashboard.page.ts
│   └── product.page.ts
├── e2e/                   ← E2E test specs
│   ├── auth.spec.ts
│   ├── product-crud.spec.ts
│   └── checkout.spec.ts
├── api/                   ← API tests
│   └── users-api.spec.ts
├── fixtures/              ← Custom fixtures & test data
│   └── test-data.ts
└── playwright.config.ts
```

### 🔧 Bài tập

Refactor 5 tests từ Module 4.2 để dùng POM pattern:
1. Tạo ít nhất 1 Page Object
2. Test file chỉ gọi method từ Page Object, không dùng locator trực tiếp
3. Thử đổi 1 locator trong Page Object → verify tất cả tests vẫn pass

### ✅ Tiêu chí hoàn thành

- [ ] Tạo được Page Object với locators + action methods
- [ ] Test file clean, chỉ gọi Page Object methods
- [ ] Hiểu tại sao POM giảm maintenance cost

---

## Module 4.4 — API Testing với Playwright

`🏷️ CỐT LÕI` `⏱️ 2-3 giờ` `🔗 Module 3.2, 4.2`

### 📘 Nội dung

Playwright không chỉ test UI — còn test API trực tiếp:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Users API', () => {
  const BASE_URL = 'https://jsonplaceholder.typicode.com';

  test('GET /users returns list of users', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/users`);

    expect(response.status()).toBe(200);
    const users = await response.json();
    expect(users.length).toBeGreaterThan(0);
    expect(users[0]).toHaveProperty('name');
    expect(users[0]).toHaveProperty('email');
  });

  test('POST /users creates a new user', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/users`, {
      data: {
        name: 'Test User',
        email: 'test@example.com',
      },
    });

    expect(response.status()).toBe(201);
    const user = await response.json();
    expect(user.name).toBe('Test User');
  });

  test('GET /users/999 returns 404', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/users/999`);
    expect(response.status()).toBe(404);
  });
});
```

### 🔧 Bài tập

Viết API tests cho NestJS backend (hoặc public API):
1. CRUD operations: Create → Read → Update → Delete → Verify deleted
2. Error cases: invalid data, unauthorized, not found
3. Ít nhất 8 test cases

### ✅ Tiêu chí hoàn thành

- [ ] Viết được API test bằng Playwright request API
- [ ] Test cả happy path và error cases
- [ ] Verify status code + response body

---

## Module 4.5 — Test Data, Fixtures & Flaky Test Handling

`🏷️ NÂNG CAO` `⏱️ 3 giờ` `🔗 Module 4.3`

### 📘 Nội dung

**Test Data Management:**
- Mỗi test tạo data riêng, cleanup sau → test independent
- KHÔNG dùng shared data giữa tests → race condition khi parallel

```typescript
// fixtures/auth.fixture.ts
import { test as base } from '@playwright/test';

type AuthFixture = {
  authenticatedPage: Page;
};

export const test = base.extend<AuthFixture>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: login
    await page.goto('/login');
    await page.getByLabel('Email').fill('test@mail.com');
    await page.getByLabel('Password').fill('Test@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL('/dashboard');

    // Provide to test
    await use(page);

    // Cleanup: logout
    await page.goto('/logout');
  },
});
```

**Flaky Tests — vấn đề #1 của automation:**

Flaky = test khi pass khi fail mà code không đổi.

| Nguyên nhân | Triệu chứng | Cách fix |
|---|---|---|
| Race condition | Element chưa render, click trượt | Dùng auto-wait, waitForResponse |
| Shared test data | Test A sửa data, test B expect data cũ | Isolate data mỗi test |
| Time dependency | Test fail vào cuối ngày/cuối tháng | Mock time, không dùng real datetime |
| Animation | Click vào element đang animate | `await locator.waitFor({ state: 'visible' })` |
| Network speed | API slow → timeout | Tăng timeout hoặc mock slow APIs |

```typescript
// playwright.config.ts — retry flaky tests
{
  retries: process.env.CI ? 2 : 0,  // retry 2 lần trên CI, 0 trên local
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',        // capture trace khi retry → debug dễ hơn
  },
}
```

### ✅ Tiêu chí hoàn thành

- [ ] Dùng được fixtures để setup/cleanup test data
- [ ] Test chạy parallel không conflict
- [ ] Biết diagnose và fix flaky test

---

# PHẦN V — AI-POWERED QA

> Phần này là lợi thế lớn nhất của bạn.
> Nền tảng MCP + agent orchestration → convert thành kỹ năng QA.

---

## Module 5.1 — AI sinh test case từ requirement

`🏷️ CỐT LÕI` `⏱️ 2-3 giờ` `🔗 Module 2.1, 2.2`

### 📘 Nội dung

**Workflow:**
```
Requirement → Bạn viết test case thủ công → Đưa cho AI review → AI bổ sung edge cases → Bạn review lại → Final test suite
```

Thứ tự đúng: **bạn nghĩ trước, AI bổ sung sau** — không phải AI sinh trước rồi bạn đọc lướt.

**Prompt Engineering cho QA — framework RCFCO:**
```
Role: Senior QA Engineer chuyên về [domain]
Context: [mô tả feature đầy đủ — user story, acceptance criteria, business rules, constraints]
Format: [output format mong muốn — table, checklist, gherkin...]
Constraint: [platform, data limits, user roles...]
Output: [số lượng, scope — "focus on negative cases", "include security edge cases"...]
```

**Ví dụ prompt hiệu quả vs không hiệu quả:**

❌ **Prompt tệ:** "Write test cases for login feature"
→ AI cho 5-7 generic test cases, không sát context

✅ **Prompt tốt:**
```
You are a Senior QA Engineer testing a Next.js e-commerce application.

Feature: User Login
- Login methods: email+password, Google OAuth, Facebook OAuth
- Password rules: 8-20 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
- Security: account locks after 5 failed attempts for 30 minutes
- Remember me: checkbox, extends session from 1 hour to 30 days
- Redirect: after login, user returns to the page they were on before

Generate test cases covering:
1. Happy paths for each login method
2. Negative cases (wrong password, non-existent email, locked account)
3. Boundary values (password length limits, attempt limits)
4. Security edge cases (session hijacking, token expiry)
5. Cross-browser concerns (Safari autofill behavior)

Format: Table with columns: ID | Title | Type (Positive/Negative) | Precondition | Steps | Expected Result | Priority
```

### 🔧 Bài tập

1. Chọn 1 feature. Viết 15 test cases thủ công (áp dụng techniques từ Module 2.2).
2. Đưa 15 test cases đó cho AI (Claude/ChatGPT) với prompt: "Review these test cases. What edge cases, boundary values, and negative scenarios am I missing?"
3. So sánh: AI suggest thêm bao nhiêu case? Bao nhiêu cái thực sự hữu ích vs noise?
4. Ghi chú pattern: bạn thường bỏ sót loại case nào? (concurrent access? Unicode? timezone?)

### ✅ Tiêu chí hoàn thành

- [ ] Viết được prompt đủ context để AI sinh test case chất lượng
- [ ] Dùng được workflow "human first, AI supplement"
- [ ] Nhận ra được khi nào AI sinh nonsense vs useful edge cases

---

## Module 5.2 — AI sinh automation test code

`🏷️ NÂNG CAO` `⏱️ 3-4 giờ` `🔗 Module 4.2, 4.3, 5.1`

### 📘 Nội dung

**Dùng AI (Claude Code, Copilot) sinh Playwright test từ mô tả:**

```
Generate a Playwright test (TypeScript, POM pattern) for:

Flow: User adds product to cart
1. Navigate to /products
2. Click on first product card
3. On product detail page, select quantity 2
4. Click "Add to Cart"
5. Navigate to /cart
6. Verify: product name matches, quantity is 2, total = price × 2

Use getByRole/getByLabel locators.
Include waitForResponse for API calls.
Handle loading states.
```

**Review checklist cho AI-generated code:**

| Check | Tại sao | Ví dụ lỗi AI hay mắc |
|---|---|---|
| Locator có tồn tại trên page thật? | AI hallucinate selector | `getByTestId('add-to-cart-btn')` — nhưng page không có test-id này |
| Assertion đúng business logic? | AI hiểu syntax, không hiểu business | Assert `toHaveText('$10.00')` nhưng app hiển thị VND |
| Wait strategy hợp lý? | AI hay dùng hard wait | `waitForTimeout(5000)` thay vì `waitForResponse()` |
| Test data realistic? | AI tạo data quá lý tưởng | Email: "test@test.com" — có thể bị reject bởi email validation |
| Edge case đủ? | AI thiên về happy path | Chỉ test "add 1 item" nhưng không test "add 0", "add 999", "add khi hết hàng" |

**Bài thực hành quan trọng:** yêu cầu AI viết test → cố tình BREAK code app (đổi text button, xóa 1 field, thay đổi API response) → xem test có catch được lỗi không. Nếu test vẫn pass khi app rõ ràng bị lỗi → test chất lượng kém.

### ✅ Tiêu chí hoàn thành

- [ ] Dùng AI sinh Playwright test code và review được output
- [ ] Tìm được ít nhất 2 lỗi trong code AI sinh ra
- [ ] Test AI sinh ra thực sự catch được bug khi app bị break

---

## Module 5.3 — Playwright MCP & Agentic Testing

`🏷️ CHUYÊN SÂU` `⏱️ 4-5 giờ` `🔗 Module 4.2, 5.2`

### 📘 Nội dung

**Playwright MCP server** = cho phép AI agent điều khiển browser thật qua MCP protocol.

Cách hoạt động:
```
AI Agent (Claude Code) ←MCP protocol→ Playwright MCP Server ←→ Browser thật
                                              │
                                    Gửi accessibility snapshot
                                    (DOM tree dạng role/name/state)
                                              │
                            AI đọc snapshot → quyết định action → gửi lệnh
```

Điểm khác biệt: AI không "nhìn" screenshot → AI đọc **accessibility tree** (cấu trúc semantic của page). Chính xác hơn, ít hallucinate hơn.

**Setup:**
```json
// Claude Code MCP config
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

**Kiến trúc 3-Agent cho test automation:**
```
┌──────────────┐
│   PLANNER    │  Phân tích requirement → lên test plan
│              │  Input: user story / feature description
│              │  Output: danh sách test scenarios + expected behaviors
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  GENERATOR   │  Sinh Playwright test code từ test plan
│              │  Input: test scenarios + accessibility snapshot
│              │  Output: executable test code
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   HEALER     │  Monitor test runs, tự sửa khi test fail do UI change
│              │  Input: failing test + error + current DOM snapshot
│              │  Output: updated test code (nếu fail do selector change)
│              │  → hoặc real bug report (nếu fail do app bug)
└──────────────┘
```

**Self-healing flow:**
```
Test fail → Healer agent check:
  → Selector cũ không match DOM mới? (UI changed)
    → Đọc accessibility snapshot → tìm element tương ứng → update selector → re-run
  → Assertion sai? (behavior changed)
    → Check requirement: behavior mới ĐÚNG requirement? → update test
    → Behavior mới SAI requirement? → report bug
```

### 🔧 Bài tập

1. Setup Playwright MCP trên Claude Code / Gemini CLI
2. Prompt AI: "Navigate to [your app URL], explore the login page, and generate Playwright test code for login flow"
3. Chạy test AI sinh ra. Fix lỗi nếu có.
4. Đổi 1 element trên UI (VD: đổi button text). Prompt AI: "This test is failing: [error]. Check the current page and fix the test."

### ✅ Tiêu chí hoàn thành

- [ ] Setup được Playwright MCP
- [ ] AI agent sinh được test code từ live page
- [ ] Thử được self-healing flow (đổi UI → AI tự sửa test)

---

## Module 5.4 — Prompt Templates & AI Limitations

`🏷️ NÂNG CAO` `⏱️ 2 giờ` `🔗 Module 5.1, 5.2`

### 📘 Nội dung

**Prompt Library cho QA — lưu và tinh chỉnh dần:**

**1. Test case generation:**
```
Role: Senior QA Engineer
Feature: [describe]
Context: [business rules, user roles, constraints]
Task: Generate [N] test cases covering happy path, negative, boundary, security
Format: Table — ID | Title | Type | Precondition | Steps | Expected | Priority
```

**2. Bug report improvement:**
```
Convert these rough notes into a professional bug report:
[paste notes]
Include: Title, Environment, Severity/Priority, Steps to Reproduce,
Expected vs Actual Result, suggested root cause if obvious
```

**3. Test code review:**
```
Review this Playwright test for:
1. Flaky test risks (hard waits, race conditions, shared state)
2. Missing assertions (are we actually verifying the right thing?)
3. Locator quality (brittle selectors?)
4. Missing edge cases
[paste code]
```

**4. Root cause analysis:**
```
This test is failing intermittently. Analyze:
- Test code: [paste]
- Error message: [paste]
- It passes 7/10 times locally, fails 5/10 on CI

Is this a flaky test or a real bug? What's the likely root cause?
```

**Giới hạn của AI — hiểu để dùng đúng:**

| AI tốt ở | AI yếu ở | Hệ quả |
|---|---|---|
| Sinh coverage rộng nhanh | Không hiểu business context nội bộ | Cần cung cấp context trong prompt |
| Pattern recognition | Sáng tạo ngoài pattern (exploratory) | Exploratory testing vẫn cần con người |
| Consistent format | Hallucinate selectors/endpoints | PHẢI chạy thử, không copy-paste |
| Review code systematically | Judgment calls (severity, priority) | Human QA vẫn quyết định |
| Sinh test data đa dạng | Hiểu constraint ngầm (VD: tên VN < 50 chars) | Review + adjust test data |

### ✅ Tiêu chí hoàn thành

- [ ] Có prompt library với ít nhất 4 prompt templates đã test thử
- [ ] Nêu được 3 giới hạn cụ thể của AI trong QA
- [ ] Biết khi nào dùng AI vs khi nào phải tự làm

---

# PHẦN VI — NON-FUNCTIONAL TESTING

> Biết concept + thực hành cơ bản 1-2 tool mỗi mảng. Không cần thành thạo tất cả.

---

## Module 6.1 — Performance & Load Testing

`🏷️ NÂNG CAO` `⏱️ 3-4 giờ` `🔗 Module 3.2`

### 📘 Nội dung

**3 loại — phân biệt rõ:**
- **Performance Test:** đo response time / throughput ở điều kiện BÌNH THƯỜNG. "Trang load trong bao lâu?"
- **Load Test:** tăng dần users đến mức MONG ĐỢI. "App chịu 1000 concurrent users không?"
- **Stress Test:** đẩy VƯỢT quá giới hạn. "App chết ở bao nhiêu users? Có tự recover không?"

**Core Web Vitals (Google metrics):**
- **LCP (Largest Contentful Paint):** < 2.5s — element lớn nhất render xong trong bao lâu
- **FID (First Input Delay) / INP:** < 100ms — user click → app phản hồi trong bao lâu
- **CLS (Cumulative Layout Shift):** < 0.1 — page có bị "nhảy" layout không

**k6 — load testing bằng JS (phù hợp nền tảng bạn):**
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },   // ramp up to 20 users
    { duration: '1m', target: 20 },    // stay at 20 for 1 minute
    { duration: '10s', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],   // 95% requests < 500ms
    http_req_failed: ['rate<0.01'],     // < 1% failure rate
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/products');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

### 🔧 Bài tập

1. Chạy Lighthouse trên webapp của bạn. Ghi lại Core Web Vitals scores.
2. Viết k6 script load test cho 1 API endpoint. Chạy với 10, 50, 100 virtual users. Khi nào response time vượt 1s?

### ✅ Tiêu chí hoàn thành

- [ ] Phân biệt performance vs load vs stress test
- [ ] Đọc được Lighthouse report
- [ ] Viết và chạy được k6 load test cơ bản

---

## Module 6.2 — Security Testing Basics

`🏷️ NÂNG CAO` `⏱️ 3 giờ` `🔗 Module 3.2`

### 📘 Nội dung

QA không cần thành pentester — nhưng cần biết OWASP Top 10 và test basic security.

**OWASP Top 10 — hiểu bản chất:**

| # | Vulnerability | Bạn test gì | Ví dụ test |
|---|---|---|---|
| 1 | **Broken Access Control** | User A access data User B? | Đổi userId trong URL: `/api/users/123` → `/api/users/456` |
| 2 | **Cryptographic Failures** | Sensitive data exposed? | Password hiện plain text trong API response? HTTP thay vì HTTPS? |
| 3 | **Injection** | Input có bị execute? | Nhập `<script>alert(1)</script>` vào form → có alert không? (XSS) |
| 4 | **Insecure Design** | Design có security holes? | "Forgot password" gửi password cũ qua email? (phải gửi reset link) |
| 7 | **Auth Failures** | Auth có yếu? | Brute force 1000 passwords → bị lock không? Session token có rotate sau login? |

**Test cơ bản bạn nên biết làm:**

```
1. IDOR (Insecure Direct Object Reference):
   - Login as User A → GET /api/orders/100 (order của A) → 200 ✅
   - Giữ nguyên token User A → GET /api/orders/200 (order của User B) → phải 403!
   - Nếu trả 200 → IDOR vulnerability 🚨

2. Auth testing:
   - Gọi API không có token → 401?
   - Gọi API với expired token → 401?
   - Gọi API với tampered token (sửa 1 char) → 401?
   - Login sai 5 lần → bị lock?

3. XSS (Cross-Site Scripting):
   - Nhập <script>alert(1)</script> vào text field
   - Submit → trang có hiện alert popup không?
   - Nếu có → XSS vulnerability 🚨
   - Nếu hiện escaped text "<script>..." → safe ✅
```

### ✅ Tiêu chí hoàn thành

- [ ] Kể được 5 OWASP vulnerabilities phổ biến nhất
- [ ] Test được IDOR trên API
- [ ] Test được XSS cơ bản trên form

---

## Module 6.3 — Accessibility Testing

`🏷️ NÂNG CAO` `⏱️ 2 giờ` `🔗 Module 3.1`

### 📘 Nội dung

Accessibility (a11y) = đảm bảo người khuyết tật cũng dùng được app (mù, điếc, motor disability).

**Test nhanh bằng tool:**
- Cài AXE DevTools extension → click "Analyze" → xem violations
- Playwright + @axe-core/playwright (đã đề cập ở Module 4)
- Lighthouse accessibility audit

**Test thủ công (5 phút):**
1. **Keyboard navigation:** bỏ mouse, chỉ dùng Tab/Enter/Escape → navigate được hết không?
2. **Color contrast:** text nhỏ + màu nhạt trên nền sáng → đọc được không?
3. **Alt text:** tắt hiển thị ảnh → vẫn hiểu nội dung không?
4. **Zoom 200%:** content có bị overflow/overlap không?

### ✅ Tiêu chí hoàn thành

- [ ] Chạy AXE audit trên 1 page, fix ít nhất 1 violation
- [ ] Navigate 1 page bằng keyboard only — ghi chú chỗ bị stuck

---

# PHẦN VII — CI/CD & TEST INFRASTRUCTURE

---

## Module 7.1 — Tích hợp test vào CI/CD pipeline

`🏷️ NÂNG CAO` `⏱️ 3 giờ` `🔗 Module 4.2`

### 📘 Nội dung

Mục tiêu: mỗi khi push code → tự động chạy test → block merge nếu test fail.

```yaml
# .github/workflows/test.yml
name: Test Suite
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  playwright-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run Playwright tests
        run: npx playwright test

      - name: Upload test report
        uses: actions/upload-artifact@v4
        if: ${{ !cancelled() }}
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

**Allure Report — test reporting đẹp:**
```bash
npm install -D allure-playwright
```

```typescript
// playwright.config.ts
reporter: [
  ['allure-playwright'],
  ['html'],  // backup HTML report
]
```

### ✅ Tiêu chí hoàn thành

- [ ] Playwright tests chạy tự động trên GitHub Actions
- [ ] PR bị block merge khi test fail
- [ ] Test report tự upload và có thể xem

---

## Module 7.2 — Test Management & Monitoring

`🏷️ NÂNG CAO` `⏱️ 2 giờ` `🔗 Module 7.1`

### 📘 Nội dung

**TestRail** (hoặc tương đương) — quản lý test case:
- Organize: test suites → test cases
- Execute: tạo test run, assign cho QA, track pass/fail
- Report: dashboard tổng hợp, trends

**Sentry** — error monitoring production:
- Track errors user thật gặp (không chờ user report)
- Stack trace + breadcrumbs (user làm gì trước khi error)
- QA dùng Sentry event để tạo bug report chính xác hơn

**Docker cho test environment:**
```bash
# docker-compose.test.yml
version: '3.8'
services:
  app:
    build: .
    ports: ['3000:3000']
    environment:
      - DATABASE_URL=postgresql://test:test@db:5432/testdb
  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=testdb
```

```bash
docker-compose -f docker-compose.test.yml up -d
npx playwright test
docker-compose -f docker-compose.test.yml down -v  # cleanup
```

### ✅ Tiêu chí hoàn thành

- [ ] Biết flow cơ bản trên TestRail (tạo test case, tạo run, track)
- [ ] Biết Sentry là gì, QA dùng nó để làm gì
- [ ] Chạy được test trên Docker-ized environment

---

# PHẦN VIII — CHUYÊN SÂU (TÙY CHỌN)

---

## Module 8.1 — Mobile Testing

`🏷️ CHUYÊN SÂU` `⏱️ Tùy chọn` `🔗 Module 4.2`

Chỉ học nếu cần. Concepts khác web:
- Gesture: swipe, pinch, long press
- Interruption: incoming call, notification, low battery, background/foreground
- Network: offline, slow 3G, wifi ↔ cellular switch
- Device fragmentation: 1000+ screen sizes, 10+ OS versions
- Tool: Appium (cross-platform), Espresso (Android native), XCUITest (iOS native)

---

## Module 8.2 — QA Soft Skills

`🏷️ NÂNG CAO` `⏱️ Ongoing`

Không phải module 1 lần — mà là kỹ năng rèn liên tục:

- **Bug advocacy:** trình bày bug có impact. Không chỉ "nó lỗi" mà "80% users dùng Chrome, bug này khiến họ không checkout được → mất revenue ước tính X/ngày"
- **Communication với dev:** QA + Dev là teammates, không phải đối thủ. "I found an issue with..." chứ không phải "You broke..."
- **Khi dev nói "works on my machine":** → reproduce lại trên CÙNG environment dev dùng. Nếu vẫn fail → record video gửi kèm. Nếu thật sự pass trên env dev → có thể environment-specific bug, valuable finding.

---

# 📅 Lịch học gợi ý

| Tuần | Modules | Output |
|---|---|---|
| 1 | 1.1, 1.2, 1.3, 1.4 | Ghi chú tư duy QA + 1 exploratory session log |
| 2 | 1.5, 2.1 | 15 test cases cho 1 feature thật |
| 3 | 2.2 | Bài tập EP/BVA/Decision Table/State Transition |
| 4 | 2.3, 2.4 | 2 bug reports thật + 1 RTM đơn giản |
| 5 | 3.1, 3.2, 3.3 | API test checklist thực hành + SQL verify exercise |
| 6 | 4.1, 4.2 | Playwright project với 5+ tests |
| 7 | 4.3, 4.4 | POM pattern + API tests trong Playwright |
| 8 | 4.5, 5.1 | Fixtures + AI test case generation exercise |
| 9 | 5.2, 5.3 | AI code gen + Playwright MCP demo |
| 10 | 5.4, 6.1 | Prompt library + k6 load test |
| 11 | 6.2, 6.3 | OWASP basic tests + a11y audit |
| 12 | 7.1, 7.2 | CI/CD pipeline hoàn chỉnh + test report |

---

# 📁 Project Structure

Lưu tất cả exercises và outputs vào:

```
/qa/
├── ROADMAP.md                    ← File gốc (reference)
├── LEARNING-PATH.md              ← File này
├── exercises/
│   ├── module-2.1-test-cases/    ← Test cases thủ công
│   ├── module-2.2-techniques/    ← EP/BVA/Decision Table exercises
│   ├── module-2.3-bug-reports/   ← Bug reports thật
│   └── module-3.2-api-testing/   ← API test notes
├── playwright-tests/             ← Automation project
│   ├── tests/
│   ├── pages/
│   └── playwright.config.ts
├── performance/                  ← k6 scripts
├── ai-prompts/                   ← Prompt templates library
└── notes/                        ← Ghi chú học tập
```

---

*File này sắp xếp theo dependency — module trước là nền cho module sau. Mỗi module có bài tập thực hành và tiêu chí tự đánh giá. Tick checkbox ✅ khi hoàn thành. Không rush — hiểu sâu 1 module rồi mới sang module tiếp.*

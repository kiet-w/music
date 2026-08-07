# 🧪 QA Engineer Roadmap — Từ Cơ Bản Đến Nâng Cao (Tích Hợp AI)

> Xây dựng lại từ roadmap.sh QA Engineer, sắp xếp theo thứ tự ưu tiên cho người **có nền tảng dev (Next.js/React/NestJS) nhưng chưa biết QA**, và nhắm tới vị trí **AI-Powered QA Trainee**.

**Lưu ý nhỏ trước khi vào nội dung:** mình không truy cập được repo `github.com/kiet-w/qa-review` (có thể repo mới tạo, đang để trống, hoặc private) nên roadmap này build hoàn toàn từ file PDF roadmap.sh bạn gửi + định hướng AI. Nếu repo đó đã có sẵn nội dung, gửi lại để mình review chồng lên bản này.

**Nhận xét nhanh về roadmap.sh gốc:** đây là một roadmap rất đầy đủ nhưng trình bày dạng "cây liệt kê phẳng" — không có thứ tự ưu tiên, không phân biệt cái nào cần học sâu vs. chỉ cần biết mặt, và **hoàn toàn không có phần AI** (roadmap.sh chưa cập nhật xu hướng AI-powered QA). Bản dưới đây giữ toàn bộ nội dung gốc nhưng: (1) sắp xếp lại theo lộ trình học tuyến tính, (2) đánh dấu phần nào bạn đã biết sẵn nhờ nền tảng dev, (3) thêm hẳn một tầng AI xuyên suốt từng giai đoạn thay vì chỉ là 1 mục phụ.

---

## Tổng quan lộ trình

| Giai đoạn | Nội dung | Độ ưu tiên | Ghi chú |
|---|---|---|---|
| 0 | Tư duy & nền tảng QA | 🔴 Cao | Hoàn toàn mới với bạn |
| 1 | Manual Testing & Test Design | 🔴 Cao | Nền tảng cho mọi thứ sau này |
| 2 | Kiến thức kỹ thuật nền | 🟢 Thấp | Bạn đã có ~80% |
| 3 | Automated Testing | 🔴 Cao | Playwright ưu tiên số 1 |
| 4 | **AI-Powered QA** | 🔴 Cao nhất | Trọng tâm phỏng vấn AvePoint |
| 5 | Non-Functional Testing | 🟡 Trung bình | Biết mặt, đào sâu 1-2 công cụ |
| 6 | CI/CD, Test Management, Reporting | 🟡 Trung bình | Bạn đã quen CI/CD từ dev |
| 7 | Mobile Testing | ⚪ Tùy chọn | Chỉ học nếu JD yêu cầu |

---

## Giai đoạn 0 — Tư duy & Nền tảng QA

**Mục tiêu:** hiểu QA là gì, tư duy khác developer ra sao, và các khái niệm nền được hỏi ở mọi vòng phỏng vấn QA.

### 0.1 Khái niệm cốt lõi

- [ ] **QA là gì, phân biệt QA vs QC vs Testing**
  - **QA (Quality Assurance):** tập trung vào **quy trình** — đảm bảo cách làm đúng để sản phẩm tốt. Mang tính phòng ngừa (preventive). VD: thiết lập coding standards, review checklist, quy trình release.
  - **QC (Quality Control):** tập trung vào **sản phẩm** — kiểm tra sản phẩm có đạt chất lượng không. Mang tính phát hiện (detective). VD: chạy test, kiểm tra output.
  - **Testing:** là **một hoạt động** trong QC — thực thi phần mềm để tìm lỗi. Testing ⊂ QC ⊂ QA.
  - 💡 Cách nhớ: QA = "làm đúng cách" → QC = "sản phẩm có đúng không" → Testing = "chạy thử để tìm lỗi"

- [ ] **QA Mindset — tư duy "tìm lỗi trước khi user tìm ra"**
  - Adversarial thinking: luôn hỏi "chuyện gì xảy ra nếu...?" — nhập sai, bỏ trống, gửi quá nhanh, mất mạng giữa chừng...
  - Dev nghĩ "làm sao cho nó chạy đúng", QA nghĩ "làm sao cho nó chạy sai" — hai mindset bổ sung nhau
  - **Không phải tìm lỗi để blame dev** — mà là tìm lỗi sớm khi sửa còn rẻ. Bug ở dev stage sửa 1h, bug ở production sửa 1 tuần + mất uy tín

- [ ] **Testing Approaches: White Box, Black Box, Gray Box**
  - **Black Box:** test dựa trên input/output, không biết code bên trong. QA thường dùng nhất. VD: nhập username/password → kiểm tra login thành công hay thất bại
  - **White Box:** test dựa trên cấu trúc code (branches, loops, paths). Dev/SDET thường dùng. VD: viết unit test cover tất cả if/else branches
  - **Gray Box:** kết hợp cả hai — biết một phần kiến trúc (API structure, DB schema) nhưng test từ góc user. VD: biết API trả về JSON format cụ thể, test xem UI hiển thị đúng không
  - 💡 Với nền tảng dev, bạn có thể nói "tôi làm Gray Box testing tự nhiên vì hiểu cả code lẫn user flow"

- [ ] **Verification vs Validation**
  - **Verification:** "Are we building the product RIGHT?" — kiểm tra sản phẩm có đúng spec/design không. VD: code review, walkthrough, inspection
  - **Validation:** "Are we building the RIGHT product?" — kiểm tra sản phẩm có đúng nhu cầu user không. VD: UAT, beta testing
  - 💡 Cách nhớ: Verification = đúng kỹ thuật, Validation = đúng mục đích

### 0.2 Mô hình phát triển & vai trò QA

- [ ] **SDLC models và vai trò QA trong từng model**
  - **Waterfall:** QA test ở cuối, sau khi dev xong hoàn toàn. Rủi ro: tìm lỗi muộn, sửa đắt
  - **V-Model:** mỗi phase dev có phase test tương ứng (requirement → acceptance test, design → system test, coding → unit test). QA tham gia từ đầu viết test plan
  - **Agile/Scrum:** QA là thành viên trong sprint team, test song song với dev, mỗi sprint đều có shippable increment. QA tham gia sprint planning, viết acceptance criteria, test trong sprint
  - **Kanban:** continuous flow, QA test liên tục khi task done, không đợi sprint end
  - **XP (Extreme Programming):** nhấn mạnh TDD, pair programming, QA rất gần dev
  - **SAFe:** Agile ở scale lớn, QA đảm bảo quality ở cả team level và program level
  - 💡 Chỉ cần hiểu khác biệt + vai trò QA, không cần học sâu methodology

### 0.3 Các khái niệm hay bị hỏi phỏng vấn

- [ ] **Test Oracle — làm sao biết một kết quả là "đúng"**
  - Oracle = nguồn để so sánh kết quả test. Có thể là: requirement document, existing system, user manual, domain expert, hoặc common sense
  - "Oracle problem": đôi khi không có oracle rõ ràng (VD: kết quả machine learning model) → cần judgment

- [ ] **Test Prioritization — test gì trước khi thời gian có hạn**
  - **Risk-based testing:** ưu tiên test features có risk cao nhất (dùng nhiều nhất, dính tiền, mới thay đổi)
  - Ma trận ưu tiên: `Risk = Probability of failure × Impact of failure`
  - Trong thực tế: test critical path trước (login, payment, core workflow), edge case sau

- [ ] **🆕 Bug Life Cycle (Defect Life Cycle)** ⚠️ *Rất hay hỏi phỏng vấn*
  ```
  New → Open/Assigned → In Progress (dev fixing)
    → Fixed → Ready for Retest → Retest
      → Verified (Close) ✅
      → Reopen (lỗi chưa sửa hết) 🔄
    → Rejected (not a bug) ❌
    → Deferred (sửa sau) ⏸️
    → Duplicate (trùng bug khác) 🔄
  ```
  - QA quản lý bug từ khi report đến khi verify close
  - Mỗi transition cần ghi rõ: ai chuyển, khi nào, lý do
  - Biết flow này để dùng đúng trên Jira/Azure DevOps

- [ ] **🆕 Severity vs Priority** ⚠️ *Câu hỏi kinh điển nhất phỏng vấn QA*
  - **Severity** = mức độ ảnh hưởng kỹ thuật. Do QA đánh giá
    - Critical: system crash, data loss, security breach
    - Major: feature chính không hoạt động, không có workaround
    - Minor: feature phụ lỗi, có workaround
    - Trivial: cosmetic (typo, misalignment)
  - **Priority** = mức độ cấp bách cần sửa. Do PM/PO quyết định
    - High: sửa ngay trong sprint này
    - Medium: sửa sprint tới
    - Low: backlog, sửa khi có thời gian
  - 💡 **Ví dụ kinh điển để nhớ:**
    - High Severity + Low Priority: app crash khi user nhập emoji vào field ít dùng → crash nặng nhưng ít ai gặp
    - Low Severity + High Priority: logo công ty hiển thị sai trên homepage → chỉ là cosmetic nhưng ảnh hưởng brand, phải sửa ngay
  - Phỏng vấn hay hỏi: "Cho ví dụ bug High Severity nhưng Low Priority" — chuẩn bị sẵn 2-3 ví dụ

- [ ] **🆕 ISTQB 7 Testing Principles** ⚠️ *Nền tảng lý thuyết, hay hỏi*
  1. **Testing shows the presence of defects, not their absence** — test chỉ chứng minh "có lỗi", không chứng minh "không còn lỗi"
  2. **Exhaustive testing is impossible** — không thể test hết mọi tổ hợp input → phải chọn test thông minh (risk-based)
  3. **Early testing saves time and money** — tìm lỗi ở requirement rẻ hơn 100x so với production
  4. **Defects cluster together** — 80% lỗi thường tập trung ở 20% modules (Pareto principle) → focus test vào module hay lỗi
  5. **Pesticide paradox** — chạy lại cùng bộ test case hoài thì không tìm được lỗi mới → phải update/thêm test case thường xuyên
  6. **Testing is context dependent** — cách test banking app ≠ cách test game ≠ cách test IoT
  7. **Absence-of-errors fallacy** — phần mềm không có lỗi nhưng không đáp ứng nhu cầu user thì vẫn thất bại

- [ ] **🆕 Entry Criteria & Exit Criteria**
  - **Entry Criteria:** điều kiện để BẮT ĐẦU test (VD: code deployed lên test env, test data sẵn sàng, test case đã review)
  - **Exit Criteria:** điều kiện để KẾT THÚC test (VD: 100% critical test pass, 95% test case executed, no open critical/major bugs)
  - Dùng trong test plan, sprint planning — QA cần biết khi nào đủ điều kiện test và khi nào đủ tự tin release

- [ ] **🆕 Requirement Traceability Matrix (RTM)**
  - Bảng mapping: Requirement → Test Case → Defect
  - Mục đích: đảm bảo mọi requirement đều có test case cover, không sót
  - Format đơn giản:

  | Req ID | Requirement | Test Case IDs | Status | Defects |
  |---|---|---|---|---|
  | REQ-001 | User can login with email | TC-001, TC-002, TC-003 | Pass | — |
  | REQ-002 | Password reset via email | TC-010, TC-011 | Fail | BUG-005 |

**Vì sao quan trọng:** đây là phần dễ bị hỏi lý thuyết nhất trong vòng phỏng vấn trainee, vì nhà tuyển dụng muốn biết bạn có tư duy QA thật hay chỉ biết code test.

### 📝 Câu hỏi phỏng vấn mẫu — Giai đoạn 0

1. "Phân biệt QA, QC, Testing — cho ví dụ thực tế?"
2. "Cho ví dụ bug có High Severity nhưng Low Priority?"
3. "Verification khác Validation như thế nào?"
4. "Kể 7 nguyên tắc testing theo ISTQB?"
5. "Mô tả Bug Life Cycle — khi nào bug bị Reopen vs Rejected?"
6. "Bạn sẽ ưu tiên test case nào trước khi deadline gấp?" (risk-based testing)
7. "Pesticide paradox là gì, cách khắc phục?"
8. "Vai trò QA trong Agile/Scrum khác Waterfall ra sao?"

### 🤖 Ứng dụng AI ở giai đoạn này

Dùng Claude/ChatGPT như một "gia sư Socratic" — thay vì đọc định nghĩa suông, hỏi AI đóng vai interviewer QA và hỏi ngược bạn. Cách này giả lập đúng không khí phỏng vấn.

**Prompt mẫu:**
```
You are a Senior QA Manager conducting a screening interview for a QA Trainee position.
The candidate has a dev background (Next.js/React/NestJS) but no formal QA experience.

Ask me 5 questions about QA fundamentals, starting easy and getting harder.
After each of my answers, grade it (1-5) and explain what a perfect answer would include.
Focus on: QA vs QC, severity vs priority, ISTQB principles, bug lifecycle, testing approaches.
```

---

## Giai đoạn 1 — Manual Testing & Test Design

**Mục tiêu:** biết viết test case/test scenario tử tế và phân biệt được các loại test — đây là kỹ năng lõi của một QA, kể cả khi làm automation.

### 1.1 Testing Levels (Phân tầng test)

- [ ] **Test Levels — hiểu 4 tầng chuẩn ISTQB:**
  ```
  Unit Test → Integration Test → System Test → Acceptance Test
  (nhỏ nhất)                                    (lớn nhất)
  ```
  - **Unit Test:** test 1 function/method riêng lẻ (bạn đã biết qua Jest)
  - **Integration Test:** test 2+ components kết hợp (VD: API controller + service + database)
  - **System Test:** test toàn bộ hệ thống end-to-end (VD: user flow hoàn chỉnh từ login → checkout)
  - **Acceptance Test (UAT):** user/PO test xem sản phẩm có đáp ứng yêu cầu business không

### 1.2 Testing Types (Functional)

- [ ] **Smoke Testing vs Sanity Testing** ⚠️ *Rất hay bị hỏi phân biệt*
  - **Smoke Test:** test nhanh các chức năng CƠ BẢN nhất sau mỗi build mới — "app có chạy được không?". Rộng nhưng nông. VD: login được không, trang chủ load không, menu hoạt động không
  - **Sanity Test:** test nhanh MỘT chức năng cụ thể sau khi dev fix bug hoặc thêm feature nhỏ — "cái vừa sửa có ổn không?". Hẹp nhưng sâu hơn smoke
  - 💡 Smoke = "tòa nhà có cháy không?" (check tổng thể), Sanity = "cái ống nước vừa sửa có chảy không?" (check cụ thể)

- [ ] **Regression Testing**
  - Test lại các chức năng CŨ sau khi có thay đổi mới → đảm bảo code mới không phá code cũ
  - Đây là loại test automation giải quyết tốt nhất (chạy lại 500 test case mỗi sprint, con người không đủ thời gian)
  - Trong Agile: regression suite chạy tự động mỗi PR/nightly build

- [ ] **Exploratory Testing**
  - Test KHÔNG có kịch bản cố định — QA dùng kinh nghiệm + trực giác để khám phá app, tìm lỗi ngoài test case
  - Session-based: time-box 60-90 phút, có charter ("Explore payment flow focusing on error handling"), ghi chú liên tục
  - 💡 Đây là thế mạnh CON NGƯỜI mà AI chưa thay thế được — nhấn mạnh điều này khi phỏng vấn

- [ ] **UAT (User Acceptance Testing)**
  - Test cuối cùng trước khi release, do user/PO/business stakeholder thực hiện
  - QA hỗ trợ chuẩn bị test data, test environment, hướng dẫn user test
  - Alpha testing (nội bộ) vs Beta testing (user thật, giới hạn)

- [ ] **Functional Testing tổng quát**
  - Test chức năng hoạt động đúng theo requirement
  - Mỗi requirement → có test case cover → verify output đúng

### 1.3 🆕 Test Design Techniques (Black-Box) ⚠️ *Phần này roadmap gốc thiếu hoàn toàn — cực kỳ quan trọng*

Đây là các kỹ thuật CHỌN test case thông minh khi không thể test hết mọi tổ hợp. Phỏng vấn QA gần như chắc chắn hỏi 1-2 kỹ thuật trong số này.

- [ ] **Equivalence Partitioning (Phân vùng tương đương)**
  - Chia input thành các nhóm (partitions) mà các giá trị trong cùng nhóm cho cùng kết quả → chỉ cần test 1 giá trị đại diện mỗi nhóm
  - VD: field "tuổi" chấp nhận 18-65:
    - Partition 1 (invalid): < 18 → chọn test: 15
    - Partition 2 (valid): 18-65 → chọn test: 30
    - Partition 3 (invalid): > 65 → chọn test: 70
  - Giảm từ hàng triệu test case xuống còn vài test case đại diện

- [ ] **Boundary Value Analysis (Phân tích giá trị biên)**
  - Lỗi thường xảy ra ở BIÊN của các partition → test chính xác tại biên
  - VD: field "tuổi" 18-65: test các giá trị **17, 18, 19, 64, 65, 66**
  - Thường dùng kết hợp với Equivalence Partitioning
  - 💡 Mẹo: luôn test `min-1, min, min+1, max-1, max, max+1`

- [ ] **Decision Table Testing (Bảng quyết định)**
  - Dùng khi có NHIỀU ĐIỀU KIỆN kết hợp ảnh hưởng đến kết quả
  - VD: Điều kiện giảm giá: (Là VIP? + Mua > 500k? + Có coupon?) → mỗi tổ hợp T/F cho kết quả khác nhau

  | # | VIP? | > 500k? | Coupon? | Giảm giá |
  |---|---|---|---|---|
  | 1 | T | T | T | 30% |
  | 2 | T | T | F | 20% |
  | 3 | T | F | T | 15% |
  | 4 | T | F | F | 10% |
  | 5 | F | T | T | 15% |
  | 6 | F | T | F | 5% |
  | 7 | F | F | T | 10% |
  | 8 | F | F | F | 0% |

  - Mỗi dòng = 1 test case. Bảng giúp không sót tổ hợp nào

- [ ] **State Transition Testing (Test chuyển trạng thái)**
  - Dùng khi hệ thống có các STATE khác nhau và transition giữa chúng
  - VD: Trạng thái đơn hàng: `Draft → Submitted → Approved → Shipped → Delivered → Completed`
  - Test: mỗi transition hợp lệ + các transition KHÔNG hợp lệ (VD: từ Draft nhảy thẳng Shipped?)
  - Vẽ state diagram → liệt kê tất cả transitions → viết test case cho mỗi cái

- [ ] **Pairwise Testing (Combinatorial Testing)**
  - Khi có NHIỀU biến (VD: OS × Browser × Resolution × Language) → số tổ hợp quá lớn
  - Pairwise: chỉ cần cover tất cả CẶP ĐÔI biến → giảm số test case ~90% mà vẫn tìm được phần lớn lỗi
  - Tool hỗ trợ: PICT (Microsoft), AllPairs
  - VD: 4 OS × 5 Browser × 3 Resolution = 60 tổ hợp → pairwise giảm còn ~15-20 test case

- [ ] **Error Guessing (Đoán lỗi)**
  - Dựa vào kinh nghiệm, trực giác để đoán chỗ hay lỗi
  - Checklist phổ biến: nhập rỗng, nhập quá dài, ký tự đặc biệt, SQL injection string, số âm, số 0, null, emoji, double submit, back button sau submit, timeout...
  - Không formal nhưng rất hiệu quả khi kết hợp với các kỹ thuật trên

### 1.4 Testing Types (Non-Functional — biết mặt, đào sâu ở Giai đoạn 5)

- [ ] **Load, Performance, Stress Testing — phân biệt 3 loại** ⚠️ *Rất hay bị nhầm*
  - **Performance Test:** đo response time, throughput trong điều kiện BÌNH THƯỜNG. "App nhanh không?"
  - **Load Test:** tăng dần số user/request lên mức MONG ĐỢI, xem hệ thống xử lý được không. "App chịu được 1000 user đồng thời không?"
  - **Stress Test:** đẩy VƯỢT quá giới hạn để tìm breaking point. "App chết ở bao nhiêu user? Có recover được không?"
  - 💡 Performance = nhanh không? Load = chịu tải không? Stress = chết ở đâu?
- [ ] Security Testing, Accessibility Testing (chi tiết ở Giai đoạn 5)

### 1.5 🆕 Bug Report Writing ⚠️ *Kỹ năng lõi bị thiếu*

Viết bug report tốt là kỹ năng QA quan trọng ngang viết test case — bug report tệ làm dev mất thời gian reproduce, gây friction giữa QA và dev.

**Format chuẩn:**
```
Title: [Module] Short, specific description
  ❌ "Login không hoạt động"
  ✅ "[Login] Error 500 khi đăng nhập bằng Google OAuth với email có dấu '+'"

Environment: Chrome 125 / Windows 11 / Staging server
Severity: Major
Priority: High

Precondition: User có tài khoản Google với email format "user+tag@gmail.com"

Steps to Reproduce:
  1. Mở trang login (https://staging.app.com/login)
  2. Click "Login with Google"
  3. Chọn tài khoản có email "test+qa@gmail.com"
  4. Authorize permissions

Expected Result: Login thành công, redirect về dashboard
Actual Result: Trang trắng, console hiện "Error 500: Invalid email format"

Attachments: screenshot_error.png, console_log.txt
Additional Notes: Đã test với email không có '+', login bình thường
```

**Best practices:**
- 1 bug = 1 report (không gộp nhiều bug)
- Steps phải reproducible — dev đọc xong phải reproduce được 100%
- Đính kèm screenshot/video/log — bằng chứng quan trọng
- Ghi rõ environment — bug có thể chỉ xảy ra trên browser/OS cụ thể

### 1.6 Test Design & Documentation

- [ ] **Test Planning — viết test plan cơ bản**
  - Test plan = tài liệu tổng quan: test cái gì, ai test, khi nào, dùng tool gì, entry/exit criteria
  - Ở level trainee: biết đọc test plan là đủ, không cần tự viết từ đầu
- [ ] **Test Case & Test Scenario — cấu trúc chuẩn**
  - **Test Scenario:** high-level, 1 dòng mô tả. VD: "Verify user can login with valid credentials"
  - **Test Case:** chi tiết, step-by-step:

  | Field | Ví dụ |
  |---|---|
  | Test Case ID | TC-LOGIN-001 |
  | Title | Verify successful login with valid email and password |
  | Precondition | User account "test@email.com" exists, not locked |
  | Test Data | Email: test@email.com, Password: Test@123 |
  | Steps | 1. Navigate to /login 2. Enter email 3. Enter password 4. Click Login |
  | Expected Result | Redirect to /dashboard, display welcome message |
  | Priority | High |
  | Test Type | Positive / Functional |

- [ ] **TDD — hiểu khái niệm** (bạn có nền tảng từ Jest rồi)
  - Red → Green → Refactor cycle
  - Dưới góc nhìn QA: TDD đảm bảo mọi logic đều có test TRƯỚC KHI viết code → chất lượng cao hơn

- [ ] **Compatibility Testing (cross-browser, cross-device)**
  - Test trên các browser (Chrome, Firefox, Safari, Edge), devices (desktop, tablet, mobile), OS (Windows, macOS, Linux)
  - Dùng BrowserStack/Sauce Labs cho cross-browser testing tự động

### 🆕 1.7 Positive Testing vs Negative Testing

- [ ] **Positive Testing:** test với input ĐÚNG, mong đợi hệ thống hoạt động đúng. VD: login đúng email + đúng password → vào dashboard
- [ ] **Negative Testing:** test với input SAI/BẤT THƯỜNG, mong đợi hệ thống xử lý gracefully. VD: login sai password → hiện error message, không crash
- 💡 QA tốt viết ~40% positive + ~60% negative test cases — phần lớn lỗi thật nằm ở negative path

### Bài tập thực hành đề xuất

**Bài tập 1:** Chọn 1 tính năng trong chính webapp Next.js của bạn (ví dụ: form đăng ký), viết 15-20 test case thủ công cho nó theo đúng format chuẩn ở trên — vừa học vừa có tài liệu thật.

**Bài tập 2 (Test Design):** Cho field "password" có yêu cầu: 8-20 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 số, 1 ký tự đặc biệt. Áp dụng:
- Equivalence Partitioning: liệt kê các partition (valid/invalid)
- Boundary Value: test ở 7, 8, 9, 19, 20, 21 ký tự
- Negative cases: toàn chữ thường, toàn số, có space, emoji...

**Bài tập 3 (Bug Report):** Tự dùng app của mình, tìm 1 bug thật (dù nhỏ), viết bug report theo format chuẩn ở mục 1.5.

### 📝 Câu hỏi phỏng vấn mẫu — Giai đoạn 1

1. "Phân biệt Smoke Testing vs Sanity Testing? Cho ví dụ?"
2. "Equivalence Partitioning là gì? Cho ví dụ với field input cụ thể?"
3. "Test case gồm những thành phần nào? Viết 1 test case mẫu cho chức năng đăng ký?"
4. "Phân biệt Positive Testing vs Negative Testing?"
5. "Regression Testing là gì? Khi nào cần chạy regression?"
6. "Exploratory Testing khác scripted testing như thế nào? Ưu nhược điểm?"
7. "Boundary Value Analysis — test field tuổi chấp nhận 1-150, liệt kê boundary values?"

### 🤖 Ứng dụng AI ở giai đoạn này (quan trọng — kỹ năng AI-QA số 1 nhà tuyển dụng muốn thấy)

- Dùng AI để sinh test case từ user story / PRD / mô tả tính năng. Kỹ thuật prompt hiệu quả: đừng hỏi chung chung "write test cases", mà cung cấp đầy đủ context — tính năng, user roles, business rules, ràng buộc dữ liệu, platform hỗ trợ, output format mong muốn. Prompt càng chi tiết, test case sinh ra càng sát và ít cần sửa.

- Dùng AI để rà "edge case bị bỏ sót" sau khi bạn tự viết test case xong — đây là cách dùng AI đúng: AI bổ sung cho tư duy con người, không thay thế.

- Thử nghiệm khác biệt giữa các model: Claude thường mạnh khi xử lý tài liệu requirement dài/nhiều file cùng lúc mà không mất mạch lạc; ChatGPT thường cho phạm vi edge-case rộng hơn ở mức nhanh. Biết khi nào dùng cái nào là điểm cộng khi phỏng vấn.

**Prompt mẫu sinh test case:**
```
You are a Senior QA Engineer. Generate comprehensive test cases for this feature:

Feature: User Registration Form
Fields: Full Name (required, 2-50 chars), Email (required, valid format),
        Password (required, 8-20 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char),
        Confirm Password (must match), Terms checkbox (required)
Business Rules: Email must be unique, password cannot contain username
Platform: Web (Chrome, Firefox, Safari), responsive

Generate test cases covering: happy path, boundary values, equivalence partitions,
negative cases, security edge cases (XSS, SQL injection in fields).
Format: Test ID | Title | Type (Positive/Negative) | Steps | Expected Result | Priority
```

**Bài tập AI:** lấy 20 test case bạn tự viết ở trên, đưa cho AI kiểm tra chéo xem thiếu case nào — so sánh và ghi chú lại pattern bạn hay bỏ sót.

---

## Giai đoạn 2 — Kiến thức kỹ thuật nền

**Mục tiêu:** phần này roadmap.sh liệt kê như kiến thức bắt buộc cho QA, nhưng với nền tảng Next.js/React/NestJS của bạn thì phần lớn đã có sẵn. Mục tiêu ở đây là *review nhanh dưới góc nhìn QA* chứ không học từ đầu.

### 2.1 Web Fundamentals (phần lớn đã biết)

- [x] HTML, CSS, JavaScript — đã có
- [x] Browser / Dev Tools — đã có, nhưng ôn lại dưới góc nhìn QA:
  - **Console tab:** check JavaScript errors, console.error → nhiều bug chỉ thấy ở console
  - **Network tab:** check API response status (200/400/401/403/404/500), response time, payload
  - **Application tab:** inspect localStorage, sessionStorage, cookies — debug auth/session bugs
  - **Performance tab:** record page load, tìm bottleneck
  - **Lighthouse tab:** chạy audit nhanh cho performance, accessibility, SEO
- [ ] CSR vs SSR — bạn hiểu rõ với Next.js rồi, chỉ cần diễn giải được góc nhìn QA:
  - SSR: content hiển thị ngay nhưng có thể bị **hydration mismatch** (server render khác client render) → QA cần test cả trước và sau hydration
  - CSR: phải đợi JS load xong → test cần handle **loading state**, skeleton screens
  - **Flaky test:** CSR app dễ gây flaky test do timing — element chưa render xong mà test đã interact → cần explicit waits
- [ ] Responsive vs Adaptive Design — khái niệm, phục vụ compatibility testing
- [ ] Ajax & Caching — hiểu dưới góc độ QA:
  - Bug kinh điển: "dữ liệu cũ vẫn hiện sau khi update" → nguyên nhân thường do cache (browser cache, API cache, CDN cache)
  - Test checklist: update data → refresh → kiểm tra hiển thị mới. Clear cache → test lại. Hard refresh (Ctrl+Shift+R) vs soft refresh
- [ ] SWA/PWA/JAMStack — biết mặt, không cần sâu

### 🆕 2.2 API Fundamentals cho QA ⚠️ *Phần này roadmap gốc thiếu — nhưng API testing là kỹ năng bắt buộc*

- [ ] **HTTP Methods và khi nào dùng:**
  - `GET` — đọc data (idempotent, safe)
  - `POST` — tạo mới (not idempotent)
  - `PUT` — update toàn bộ resource (idempotent)
  - `PATCH` — update một phần (not idempotent)
  - `DELETE` — xóa (idempotent)
  - 💡 Với nền NestJS, bạn đã biết phần này — chỉ cần nhìn lại qua lens QA

- [ ] **HTTP Status Codes — nhớ các nhóm chính:**
  - `2xx` Success: 200 OK, 201 Created, 204 No Content
  - `3xx` Redirect: 301 Moved Permanently, 302 Found
  - `4xx` Client Error: 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable Entity, 429 Too Many Requests
  - `5xx` Server Error: 500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable
  - QA cần verify: API trả đúng status code cho đúng tình huống (VD: login sai password phải trả 401, không phải 500)

- [ ] **REST API testing checklist cho QA:**
  - Response status code đúng
  - Response body format đúng (JSON schema validation)
  - Response time chấp nhận được (< 200ms cho API đơn giản)
  - Error responses có message rõ ràng, không leak stack trace
  - Authentication/Authorization: API có yêu cầu token/key không, trả 401/403 khi thiếu
  - Pagination: hoạt động đúng khi data lớn
  - Rate limiting: có giới hạn request không, trả 429 khi vượt

- [ ] **GraphQL basics** (nếu project dùng):
  - Khác REST: 1 endpoint duy nhất, client query đúng data cần
  - QA test: over-fetching, under-fetching, query depth limit, introspection disabled on production

### 🆕 2.3 Database/SQL cho QA ⚠️ *Quan trọng nhưng hay bị bỏ qua*

- [ ] **SQL cơ bản cho QA:** không cần viết complex queries, nhưng cần đủ để verify data
  ```sql
  -- Kiểm tra user vừa tạo có trong DB không
  SELECT * FROM users WHERE email = 'test@email.com';

  -- Kiểm tra data integrity sau khi update
  SELECT order_status, updated_at FROM orders WHERE id = 123;

  -- Đếm records (verify pagination)
  SELECT COUNT(*) FROM products WHERE category = 'electronics';

  -- Check duplicate data
  SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;
  ```
- [ ] **Khi nào QA cần query DB:**
  - Verify data sau khi UI action (tạo/sửa/xóa) — không chỉ tin UI, check cả DB
  - Debug: UI hiển thị sai → check DB xem data có đúng không → isolate bug ở frontend hay backend
  - Test data setup: insert test data trực tiếp vào DB cho specific test scenarios

### 🆕 2.4 Linux/Command Line cơ bản

- [ ] Biết đủ để navigate server, đọc log, và chạy test trên CI environment:
  ```bash
  # Đọc log
  tail -f /var/log/app.log          # follow log realtime
  grep "ERROR" app.log              # tìm errors trong log
  grep -i "timeout" app.log | wc -l # đếm số lần timeout

  # File system
  find . -name "*.log" -mtime -1    # tìm log files modified trong 24h
  du -sh /var/log/                  # check disk usage (liên quan performance)

  # Process
  ps aux | grep node               # check app process đang chạy
  curl -I https://api.example.com  # quick health check API
  ```
- Bạn đã quen terminal từ dev → phần này review 15 phút là đủ

**Thời gian đề xuất:** 1-2 buổi review, không cần dành cả tuần cho phần này. Focus vào API fundamentals và SQL cho QA vì đây là kiến thức mới dưới góc nhìn QA.

---

## Giai đoạn 3 — Automated Testing

**Mục tiêu:** biết viết automated test thật, ưu tiên công cụ có hệ sinh thái AI mạnh nhất năm 2026.

### 🆕 3.0 Test Automation Pyramid ⚠️ *Khái niệm nền bắt buộc biết*

```
        /  UI/E2E Tests  \        ← Ít nhất, chậm nhất, đắt nhất
       / Integration Tests \      ← Vừa phải
      /    Unit Tests       \     ← Nhiều nhất, nhanh nhất, rẻ nhất
     ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾
```

- **Unit Tests (70%):** nhanh, stable, test logic riêng lẻ. Dev viết chính
- **Integration Tests (20%):** test API, service interaction. QA + Dev cùng viết
- **E2E/UI Tests (10%):** chậm, dễ flaky, nhưng test trải nghiệm user thật. QA viết chính
- 💡 Anti-pattern phổ biến: "Ice Cream Cone" — quá nhiều E2E test, quá ít unit test → CI chạy chậm, flaky liên tục

### 3.1 Frontend Automation (ưu tiên theo thứ tự)

**1. Playwright — học đầu tiên và sâu nhất**

Lý do ưu tiên: hệ sinh thái AI/MCP quanh Playwright hiện là mạnh và official nhất (xem Giai đoạn 4), API hiện đại, hỗ trợ tốt cho stack Next.js/React.

- [ ] **Setup & cấu trúc project:**
  ```bash
  npm init playwright@latest
  # Cấu trúc:
  # tests/           ← test files
  # tests/fixtures/  ← custom fixtures
  # playwright.config.ts ← config (browsers, baseURL, timeout...)
  ```

- [ ] **Core concepts:**
  - Locators: `page.getByRole()`, `page.getByText()`, `page.getByTestId()` — ưu tiên user-facing locators
  - Actions: `click()`, `fill()`, `check()`, `selectOption()`
  - Assertions: `expect(locator).toBeVisible()`, `toHaveText()`, `toHaveURL()`
  - Auto-waiting: Playwright tự đợi element actionable trước khi interact — giảm flaky test

- [ ] **🆕 Page Object Model (POM)** ⚠️ *Design pattern bắt buộc biết*
  ```typescript
  // pages/login.page.ts
  export class LoginPage {
    constructor(private page: Page) {}

    // Locators
    readonly emailInput = this.page.getByLabel('Email');
    readonly passwordInput = this.page.getByLabel('Password');
    readonly loginButton = this.page.getByRole('button', { name: 'Login' });
    readonly errorMessage = this.page.getByRole('alert');

    // Actions
    async login(email: string, password: string) {
      await this.emailInput.fill(email);
      await this.passwordInput.fill(password);
      await this.loginButton.click();
    }

    // Assertions
    async expectError(message: string) {
      await expect(this.errorMessage).toHaveText(message);
    }
  }

  // tests/login.spec.ts
  test('login with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await page.goto('/login');
    await loginPage.login('user@test.com', 'Password123!');
    await expect(page).toHaveURL('/dashboard');
  });
  ```
  - **Lợi ích:** khi UI đổi, chỉ sửa Page Object — không sửa 50 test files
  - **Vì sao quan trọng:** mọi test automation framework đều dùng POM hoặc biến thể — phỏng vấn hay hỏi

- [ ] **🆕 Test Data Management & Fixtures:**
  ```typescript
  // Fixture: tạo test data trước test, cleanup sau test
  test.beforeEach(async ({ page }) => {
    // Setup: tạo user test
    await api.createUser({ email: 'test@test.com', password: 'Test123!' });
  });

  test.afterEach(async () => {
    // Cleanup: xóa test data
    await api.deleteUser('test@test.com');
  });
  ```

- [ ] **🆕 Handling Waits & Synchronization:**
  ```typescript
  // ❌ Sai: hard wait
  await page.waitForTimeout(3000);

  // ✅ Đúng: wait for specific condition
  await page.waitForResponse(resp => resp.url().includes('/api/users'));
  await expect(page.getByText('Success')).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
  ```

- [ ] **Trace Viewer, Screenshot/Video on failure:**
  ```typescript
  // playwright.config.ts
  {
    use: {
      screenshot: 'only-on-failure',
      video: 'retain-on-failure',
      trace: 'on-first-retry',
    }
  }
  ```

- [ ] **Parallel execution & Sharding:**
  - Playwright chạy test song song mặc định (mỗi test trong worker riêng)
  - Sharding: chia test suite chạy trên nhiều CI machines

**2. Cypress — học ở mức đọc hiểu**
- [ ] Biết syntax cơ bản: `cy.visit()`, `cy.get()`, `cy.contains()`, `cy.intercept()`
- [ ] Hiểu khác biệt với Playwright: Cypress chạy trong browser (same-origin), Playwright chạy ngoài browser (multi-tab, multi-origin)
- [ ] Nhiều legacy project vẫn dùng → biết đọc Cypress test là đủ

**3. Selenium — biết mặt**
- [ ] Biết khái niệm WebDriver, lịch sử
- [ ] Không cần thực hành sâu trừ khi JD yêu cầu

### 3.2 Backend/API Automation

- [ ] **Postman / Newman — công cụ nhập môn API testing**
  - Collections, Environments, Variables
  - Pre-request scripts & Test scripts (JavaScript)
  - Newman: chạy Postman collections từ CLI → tích hợp CI/CD
  - 💡 Nên biết ở level: tạo collection, viết basic test assertion, chạy Newman trên CI

- [ ] **Viết API test bằng Playwright:**
  ```typescript
  test('GET /api/users returns user list', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body).toHaveProperty('data');
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0]).toHaveProperty('email');
  });

  test('POST /api/users creates new user', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: { email: 'new@test.com', name: 'Test User' }
    });
    expect(response.status()).toBe(201);
  });
  ```
  - Lợi ích: dùng chung framework Playwright cho cả UI test và API test

- [ ] REST Assured, SoapUI, Karate — biết mặt, học sâu chỉ nếu công ty dùng stack Java

### 3.3 Unit Testing

- [x] Jest — bạn đã có từ NestJS. Nhìn lại dưới góc độ QA:
  - [ ] **Code Coverage:** biết đọc coverage report (line, branch, function coverage). Coverage 80%+ thường là target tốt
  - [ ] **Test Doubles:** phân biệt Mock, Stub, Spy, Fake — khi nào dùng cái nào
  - [ ] **Test Independence:** mỗi test phải chạy độc lập, không phụ thuộc thứ tự

### 🆕 3.4 Flaky Tests — hiểu và xử lý ⚠️ *Vấn đề phổ biến nhất trong automation*

- [ ] **Flaky test = test khi pass khi fail mà không thay đổi code**
- [ ] **Nguyên nhân phổ biến:**
  - Race condition: element chưa render, API chưa trả response
  - Test data dependency: test dùng chung data, test trước ảnh hưởng test sau
  - Time-dependent: test phụ thuộc thời gian thật (timezone, date format)
  - External dependency: third-party API không stable
- [ ] **Cách xử lý:**
  - Dùng explicit waits thay vì hard wait
  - Isolate test data (mỗi test tạo data riêng, cleanup sau)
  - Mock external services
  - Retry mechanism (Playwright hỗ trợ `retries` trong config)
  - Quarantine flaky tests: tách riêng, không block CI pipeline

### Bài tập thực hành

Viết bộ automation test Playwright cho chính webapp Next.js hiện tại của bạn:
1. **Login flow:** happy path + wrong password + empty fields + locked account
2. **1 CRUD flow:** create item → verify in list → edit → verify changes → delete → verify removed
3. **Dùng POM pattern:** tạo ít nhất 2 Page Objects
4. **1 API test:** verify API response cho endpoint chính

→ Vừa học vừa có project demo cho phỏng vấn.

### 📝 Câu hỏi phỏng vấn mẫu — Giai đoạn 3

1. "Test Automation Pyramid là gì? Tại sao unit test ở dưới cùng?"
2. "Page Object Model là gì? Tại sao dùng?"
3. "Flaky test là gì? Nguyên nhân và cách xử lý?"
4. "Playwright khác Cypress khác Selenium như thế nào?"
5. "Khi nào nên automate, khi nào nên test thủ công?"
6. "Bạn xử lý test data trong automation test như thế nào?"

---

## Giai đoạn 4 — ⭐ AI-Powered QA (Trọng tâm đặc biệt)

Đây là phần quan trọng nhất với định hướng "AI-Powered QA Engineer" của bạn. Với nền tảng bạn đã có sẵn (dùng Claude Code/Gemini CLI hàng ngày, tự build MCP server, quan tâm agent orchestration), phần này thực ra là **lợi thế cạnh tranh lớn nhất** so với QA truyền thống — hãy khai thác triệt để trong phỏng vấn.

### 4.1 AI sinh test case từ requirement

Đã đề cập ở Giai đoạn 1 — đây là kỹ năng nền, lặp lại nhấn mạnh vì là kỹ năng AI-QA phổ biến nhất trong thực tế công việc hàng ngày.

**Workflow thực tế:**
```
Requirement/User Story → Prompt AI (với đầy đủ context)
  → AI sinh test cases draft → QA review + bổ sung domain knowledge
  → Final test suite → Execute
```

### 4.2 AI sinh code automation test

- [ ] **Dùng Claude Code / GitHub Copilot để sinh Playwright test script từ mô tả bằng ngôn ngữ tự nhiên**

  Prompt mẫu:
  ```
  Generate a Playwright test for the following user flow on our Next.js e-commerce app:
  1. User visits /products page
  2. Filters products by category "Electronics" using the dropdown
  3. Sorts by "Price: Low to High"
  4. Clicks on the first product card
  5. Adds to cart with quantity 2
  6. Navigates to cart, verifies item name, quantity (2), and total price

  Use Page Object Model pattern.
  Base URL: http://localhost:3000
  Use role-based locators (getByRole, getByLabel) where possible.
  Include proper assertions for each step.
  Handle loading states with waitForResponse.
  ```

- [ ] **Học cách review code AI sinh ra** — đây là kỹ năng bắt buộc, không phải "generate rồi commit thẳng"
  - **Review checklist cho AI-generated test code:**
    - [ ] Selector có đúng không? AI hay chọn selector quá brittle (xpath) hoặc hallucinate class name không tồn tại
    - [ ] Assertion có đúng logic nghiệp vụ không? AI hiểu syntax nhưng không hiểu business rule
    - [ ] Wait strategy có hợp lý không? AI hay dùng `waitForTimeout` (anti-pattern)
    - [ ] Test data có realistic không? AI hay tạo data quá lý tưởng
    - [ ] Edge case có đủ không? AI thường thiên về happy path
    - [ ] Cleanup/teardown có đủ không?

- [ ] **Thực hành:** yêu cầu AI viết test, rồi cố tình phá 1 chỗ trong code app để xem test có bắt được lỗi không (kiểm tra chất lượng test AI sinh ra)

### 4.3 Playwright MCP — Agentic Browser Testing (điểm khác biệt lớn nhất của bạn)

Microsoft phát hành official **Playwright MCP server** — cho phép AI agent (Claude Code, Cursor, Claude Desktop...) điều khiển trình duyệt thật qua giao thức MCP mà bạn đã quen thuộc. Điểm kỹ thuật đáng chú ý: MCP server này hoạt động trên **accessibility tree** (cấu trúc role/name/state của trang) thay vì screenshot — nghĩa là AI không cần khả năng "nhìn" ảnh, thao tác chính xác và deterministic hơn, giảm hallucination khi chọn sai selector.

- [ ] **Cài đặt `microsoft/playwright-mcp`**, kết nối vào Claude Code hoặc Cursor
  ```json
  // .claude/mcp.json hoặc settings.json
  {
    "mcpServers": {
      "playwright": {
        "command": "npx",
        "args": ["@playwright/mcp@latest"]
      }
    }
  }
  ```
  (Bạn đã có kinh nghiệm setup MCP qua `mcp-database`/`mcp-frontend`, nên bước này sẽ nhanh)

- [ ] **Thử flow thực tế:** prompt AI agent "Viết test cho luồng login + checkout", để AI tự đọc DOM/accessibility snapshot của app và sinh test

- [ ] **Thử flow "self-healing":** khi 1 selector trong test bị lỗi do UI đổi, prompt AI agent tự sửa lại dựa trên DOM snapshot hiện tại. Ví dụ:
  ```
  This Playwright test is failing because the UI was updated:
  [paste failing test + error message]

  Use the Playwright MCP to navigate to the page, inspect the current
  accessibility tree, and fix the selectors to match the new UI.
  ```

- [ ] **Ghi chú lại kiến trúc 3-agent phổ biến:**
  ```
  ┌─────────┐     ┌────────────┐     ┌──────────┐
  │ Planner │ ──→ │ Generator  │ ──→ │  Healer  │
  │(lên KH) │     │(sinh code) │     │(sửa test)│
  └─────────┘     └────────────┘     └──────────┘
       │                │                  │
       └── Test Plan    └── Test Code      └── Fixed Test
  ```
  - **Planner:** phân tích requirement, lên kế hoạch test (test scenario, coverage matrix)
  - **Generator:** sinh Playwright test code từ plan
  - **Healer:** monitor test runs, tự sửa selector/assertion khi test fail do UI change (không phải do real bug)
  - 💡 Đây là mô hình bạn có thể nói rõ trong phỏng vấn để thể hiện hiểu sâu chứ không chỉ "biết dùng AI"

**Vì sao phần này đáng đầu tư nhất:** bạn đã có nền tảng MCP + agent orchestration từ trước (ghi trong định hướng LLM engineering của bạn), nên đây là chỗ bạn convert kiến thức cũ thành lợi thế QA — ít ứng viên QA khác có sẵn nền này.

### 4.4 Self-healing tests & Visual AI Testing

- [ ] **Khái niệm self-healing test:**
  - Test tự detect khi selector bị thay đổi (VD: button đổi từ `id="submit-btn"` thành `id="login-submit"`)
  - Tự tìm selector mới dựa trên: text content, position, accessibility attributes, visual similarity
  - Giảm test maintenance cost đáng kể (trong dự án lớn, 30-40% effort automation là maintenance)

- [ ] **Visual regression testing với AI:**
  - **Applitools Eyes:** AI-powered visual comparison — hiểu layout, bỏ qua minor differences (anti-aliasing, font rendering), chỉ flag thay đổi thật sự
  - **Percy:** snapshot-based visual testing, tích hợp CI/CD
  - So sánh: pixel-by-pixel comparison (dễ false positive) vs AI comparison (thông minh hơn, ít noise)
  - Playwright built-in: `expect(page).toHaveScreenshot()` — dùng pixel comparison, đủ cho nhiều case

### 🆕 4.5 AI trong Test Data Generation

- [ ] **Dùng AI sinh test data realistic:**
  ```
  Generate 50 realistic test user records for a Vietnamese e-commerce platform.
  Each record: full_name (Vietnamese names), email, phone (VN format 09x/08x/07x),
  address (real Vietnamese cities/districts), date_of_birth (18-65 years old),
  account_status (mix of active/inactive/suspended).
  Format: JSON array. Include edge cases: very long names, names with diacritics,
  phone numbers at boundary (exactly 10 digits).
  ```
  - AI sinh data đa dạng hơn tự nghĩ — giảm bias trong test data
  - Quan trọng khi cần test với dữ liệu đặc thù (Unicode, diacritics, right-to-left text)

### 4.6 AI trong bug triage & log analysis (giữ nguyên + bổ sung)

- [ ] **Dùng AI để tóm tắt log CI/CD dài**, tìm nguyên nhân gốc (root cause) nhanh hơn đọc thủ công
  ```
  Analyze this CI/CD log and identify:
  1. Which tests failed and why
  2. Root cause (test bug or app bug?)
  3. Is this a flaky test? (check if it passed in recent runs)
  [paste log]
  ```

- [ ] **Dùng AI để viết lại bug report** từ ghi chú thô thành report chuẩn
  ```
  Convert these rough notes into a professional bug report:
  "login broken, tried google auth, got white screen, only on chrome,
  works on firefox, saw error 500 in console"

  Format: Title, Environment, Severity, Steps to Reproduce,
  Expected Result, Actual Result, Attachments needed
  ```

### 🆕 4.6.1 AI cho Flaky Test Detection

- [ ] **Pattern recognition:** feed AI lịch sử test results → AI identify tests có pass/fail ratio bất thường
- [ ] **Root cause analysis:** AI phân tích test code + failure log → suggest fix (race condition? data dependency? timeout too short?)

### 4.7 AI code review cho mục đích QA (giữ nguyên + bổ sung)

- [ ] Dùng AI review PR để tìm thiếu test coverage, edge case chưa xử lý
  ```
  Review this PR from a QA perspective (not code quality):
  1. What test cases are needed for this change?
  2. What edge cases are not handled in the code?
  3. Could this change break existing functionality? (regression risk)
  4. Are there security implications?
  [paste PR diff]
  ```
  - Góc nhìn khác với code review thông thường: dev review "code có chạy đúng không", QA review "code có che hết case chưa"

### 4.8 Prompt Engineering Framework cho QA (giữ nguyên + bổ sung thêm templates)

**Framework RCFCO (Role-Context-Format-Constraint-Output):**
```
Role: Senior QA Engineer chuyên về [web app / API / mobile]
Context: [mô tả tính năng, user story, acceptance criteria]
Task: Sinh test case bao phủ: happy path, edge case, negative case,
      boundary value, [nếu có] security case cơ bản
Format: Bảng gồm Test ID | Title | Precondition | Steps | Expected Result | Priority
Constraint: [platform, business rule, dữ liệu ràng buộc nếu có]
```

**🆕 Prompt Templates bổ sung:**

**Template 1: Exploratory Testing Charter**
```
You are a QA expert. Create 5 exploratory testing charters for this feature:
[describe feature]
Each charter should include:
- Mission: what to explore
- Time box: suggested duration
- Risk areas: what bugs to look for
- Notes: specific areas to focus on
```

**Template 2: Regression Test Selection**
```
Given this code change (PR diff), identify:
1. Which existing features could be affected (regression risk)
2. Minimum regression test cases needed
3. Priority order for execution
[paste diff]
```

**Template 3: Test Strategy Review**
```
Review my test plan for completeness:
[paste test plan]
Identify:
- Missing test scenarios
- Insufficient coverage areas
- Risk areas not addressed
- Suggested improvements
```

- [ ] Lưu prompt mẫu này, tinh chỉnh dần theo dự án thực tế

### 4.9 Giới hạn của AI trong QA — điều cần nói rõ khi phỏng vấn

Đây là phần dễ bị bỏ qua nhưng nhà tuyển dụng đánh giá cao khi ứng viên hiểu rõ giới hạn thay vì chỉ hype AI:

- **AI sinh test case tốt cho *coverage rộng***, nhưng không thay thế được hiểu biết nghiệp vụ sâu — vẫn cần con người review trước khi đưa vào test suite chính thức
- **AI có thể hallucinate** selector/API endpoint không tồn tại — luôn cần chạy thử, không tin tuyệt đối
- **Exploratory testing** (khám phá lỗi ngoài kịch bản) vẫn là thế mạnh của con người, chưa thể tự động hóa hoàn toàn
- **🆕 Context window limit:** AI có giới hạn context → với hệ thống lớn, cần chia nhỏ scope, feed context chọn lọc
- **🆕 Domain-specific knowledge:** AI không biết business rules nội bộ công ty → QA phải cung cấp context này trong prompt
- **🆕 Test maintenance:** AI sinh test dễ, nhưng maintain test suite dài hạn vẫn cần human judgment (test nào xóa, test nào update, test nào merge)

💡 **Câu trả lời phỏng vấn mẫu:** "Tôi dùng AI để tăng tốc độ sinh test case và code automation, nhưng luôn review output vì AI không hiểu business context và có thể hallucinate. AI là force multiplier cho QA, không phải replacement — nó giúp tôi cover nhiều hơn trong cùng thời gian, nhưng critical thinking và domain knowledge vẫn phải đến từ con người."

---

## Giai đoạn 5 — Non-Functional Testing

**Mục tiêu:** biết khái niệm và thực hành cơ bản với 1-2 công cụ mỗi mảng, không cần thành thạo tất cả.

### 5.1 Accessibility Testing

- [ ] **Wave, AXE** — extension trình duyệt, chạy thử trên chính webapp của bạn
  - AXE DevTools: check WCAG compliance tự động
  - Focus vào: alt text cho images, keyboard navigation, color contrast, ARIA labels
- [ ] **Chrome DevTools Lighthouse** — bạn có thể đã dùng khi tối ưu performance Next.js, giờ nhìn dưới góc độ QA
- [ ] **🆕 Automated accessibility testing trong Playwright:**
  ```typescript
  import AxeBuilder from '@axe-core/playwright';

  test('homepage should not have accessibility violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
  ```

### 5.2 Performance/Load Testing

- [ ] **Lighthouse, WebPageTest** — công cụ nhẹ, chạy nhanh
  - Core Web Vitals: LCP (Largest Contentful Paint), FID (First Input Delay), CLS (Cumulative Layout Shift)
  - Đây là metrics Google dùng để rank SEO → biết test chúng có giá trị thực tế

- [ ] **k6 — script bằng JS, ưu tiên hơn JMeter** cho background JS của bạn
  ```javascript
  import http from 'k6/http';
  import { check, sleep } from 'k6';

  export const options = {
    vus: 100,        // 100 virtual users
    duration: '30s', // chạy 30 giây
    thresholds: {
      http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    },
  };

  export default function () {
    const res = http.get('https://api.example.com/products');
    check(res, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    sleep(1);
  }
  ```

- [ ] Biết mặt: Gatling (Scala), Locust (Python), Artillery (JS), Vegeta (Go), JMeter (Java — legacy nhưng phổ biến)

### 5.3 Security Testing

- [ ] **OWASP Top 10** — bắt buộc biết ở mức khái niệm:
  1. **Broken Access Control** — user truy cập resource không được phép
  2. **Cryptographic Failures** — dữ liệu nhạy cảm không mã hóa
  3. **Injection** (SQL, XSS, Command) — input không sanitize
  4. **Insecure Design** — thiếu security trong thiết kế
  5. **Security Misconfiguration** — default config, unnecessary features enabled
  6. **Vulnerable Components** — thư viện có CVE chưa update
  7. **Authentication Failures** — weak password, no MFA, session fixation
  8. **Data Integrity Failures** — không verify integrity (software update, CI/CD pipeline)
  9. **Logging & Monitoring Failures** — không ghi log đủ để detect breach
  10. **Server-Side Request Forgery (SSRF)** — server bị trick gọi internal resources

- [ ] **Authentication/Authorization testing cơ bản** (bạn đã có nền JWT + Redis từ NestJS):
  - Test: expired token → 401? Tampered token → 401? Role escalation → 403?
  - Test: IDOR (Insecure Direct Object Reference) — user A access data user B bằng cách đổi ID trong URL

- [ ] Biết mặt: vulnerability scanning (OWASP ZAP, Burp Suite), secrets management (Vault)

### 🆕 5.4 Usability Testing

- [ ] **Heuristic evaluation** (Nielsen's 10 Usability Heuristics) — biết mặt
- [ ] **User flow analysis:** đường đi từ landing → goal (mua hàng, đăng ký) có mượt không
- [ ] QA không cần thành UX researcher, nhưng cần nhận ra "cái này user sẽ bị confused" khi test

### 5.5 Email Testing (biết mặt)

- [ ] Mailinator, Gmail Tester — dùng khi cần test luồng xác thực email/OTP
- [ ] Mailtrap — email sandbox cho development/testing, tránh gửi email thật

---

## Giai đoạn 6 — CI/CD, Test Management, Reporting & Monitoring

**Mục tiêu:** phần này phần lớn overlap với kỹ năng dev bạn đã có, chỉ cần học thêm góc nhìn QA và vài công cụ chuyên biệt.

### 6.1 Version Control & CI/CD

- [x] Git, GitHub/GitLab — đã có
- [x] CI/CD khái niệm (GitHub Actions, Jenkins...) — đã có nền

- [ ] **🆕 Tích hợp Playwright tests vào GitHub Actions:**
  ```yaml
  # .github/workflows/playwright.yml
  name: Playwright Tests
  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]

  jobs:
    test:
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
        - uses: actions/upload-artifact@v4
          if: ${{ !cancelled() }}
          with:
            name: playwright-report
            path: playwright-report/
  ```

### 6.2 Test Management

- [ ] **TestRail** — phổ biến nhất, nên học trước
  - Tạo test suite, test case, test run
  - Assign test cases cho tester
  - Track execution status (pass/fail/blocked/retest)
  - Dashboard & reporting
- [ ] Biết mặt: qTest, TestLink, Zephyr (Jira plugin), Azure Test Plans

### 6.3 Reporting

- [ ] **Allure Report** — công cụ tạo report test đẹp, tích hợp tốt với Playwright
  ```bash
  npm install -D allure-playwright
  # playwright.config.ts:
  # reporter: 'allure-playwright'
  npx playwright test
  npx allure generate allure-results -o allure-report
  npx allure open allure-report
  ```
  - Report bao gồm: test steps, screenshots, timeline, trends, categories

### 6.4 Monitoring & Logs

- [ ] **Sentry** — error tracking từ production, QA dùng để:
  - Phát hiện bug user thật gặp (không chờ user report)
  - Xem stack trace, breadcrumbs (user action trước khi error)
  - Tạo bug report từ Sentry event
- [ ] Biết mặt: Grafana (metrics dashboard), Datadog (APM), Kibana (log search)

### 🆕 6.5 Test Environment Management

- [ ] **Docker basics cho test:**
  ```bash
  # Chạy test trên environment isolated
  docker-compose up -d  # start app + DB
  npx playwright test   # run tests
  docker-compose down   # cleanup
  ```
  - Đảm bảo test environment consistent giữa local và CI
  - Bạn đã quen Docker từ dev → chỉ cần nhìn dưới góc QA

### 6.6 Project Management

- [ ] **Jira/Trello** — quy trình QA:
  - Bug workflow trên Jira: tạo bug ticket, assign to dev, link to test case, track resolution
  - Sprint board: QA task tracking (test execution, bug verification)
  - Dashboards: bug trends, test execution progress, defect density

---

## Giai đoạn 7 — Mobile Testing (Tùy chọn / Nâng cao)

Chỉ đầu tư vào phần này nếu JD của AvePoint có yêu cầu cụ thể về mobile. Nếu không, để cuối lộ trình.

- [ ] **Appium** — công cụ automation mobile phổ biến nhất, cross-platform
  - Kiến trúc tương tự Selenium WebDriver nhưng cho mobile
  - Viết test bằng JS/Python/Java
- [ ] Biết mặt: Espresso/Detox (Android), XCUITest (iOS)
- [ ] **🆕 Mobile-specific testing concerns:**
  - Gesture testing: swipe, pinch, long press
  - Interruption testing: incoming call, notification, low battery, app background/foreground
  - Network conditions: offline, slow 3G, wifi switch
  - Device fragmentation: screen sizes, OS versions

---

## 🆕 Giai đoạn Bonus — Soft Skills cho QA

Phần này không có trong roadmap.sh nhưng rất quan trọng trong thực tế:

- [ ] **Bug Advocacy** — trình bày bug thuyết phục để dev/PM agree fix:
  - Không chỉ nói "nó lỗi" mà phải giải thích impact: "80% user dùng Chrome, bug này khiến họ không checkout được → mất revenue"
  - Severity + data + user impact = bug được fix nhanh

- [ ] **Communication với Dev team:**
  - QA và Dev là đồng đội, không phải đối thủ
  - Feedback constructive: "I found an issue with..." chứ không phải "You broke..."
  - Pair testing: ngồi cùng dev debug issue → hiểu code context, dev hiểu test perspective

- [ ] **Documentation & Knowledge Sharing:**
  - Viết test case/bug report rõ ràng → người khác đọc hiểu ngay
  - Maintain wiki/confluence cho team: test strategy, known issues, test environment setup guide

---

## Lịch học đề xuất (8–10 tuần, ~1-1.5h/ngày)

| Tuần | Nội dung | Deliverable |
|---|---|---|
| 1 | GĐ 0 (Nền tảng QA) + GĐ 2 (review nhanh) | Flashcards lý thuyết QA + note API/SQL cho QA |
| 2 | GĐ 1 (Manual Testing — test design techniques) | 20 test cases cho 1 feature thật (dùng EP, BVA) |
| 3 | GĐ 1 tiếp (bug report, test plan) + AI test case generation | Bug report mẫu + so sánh test case tự viết vs AI |
| 4 | GĐ 3 (Playwright — setup, POM, core concepts) | Playwright project với POM cho login flow |
| 5 | GĐ 3 tiếp (API test, fixtures, flaky test handling) | CRUD flow automated + API tests |
| 6 | GĐ 4 (AI-Powered QA — AI gen code, Playwright MCP) | Demo: AI sinh + tự sửa Playwright test |
| 7 | GĐ 4 tiếp (visual testing, self-healing, prompt templates) | Prompt template library + self-healing demo |
| 8 | GĐ 5 (Non-Functional — accessibility, k6, OWASP basics) | Lighthouse report + k6 load test script |
| 9 | GĐ 6 (CI/CD integration, Allure report, TestRail overview) | GitHub Actions pipeline chạy Playwright + Allure |
| 10 | Ôn tập tổng hợp + mock interview với AI + polish demo project | **Complete project demo + mock interview recordings** |

### Project demo cuối lộ trình (khuyến nghị mạnh)

Dùng chính webapp Next.js hiện tại của bạn, build một bộ test suite hoàn chỉnh:

```
📁 qa-demo-project/
├── 📁 test-cases/           ← Test case thủ công (markdown/spreadsheet)
│   ├── login-test-cases.md
│   └── crud-test-cases.md
├── 📁 tests/                ← Playwright automation
│   ├── 📁 pages/            ← Page Object Models
│   ├── 📁 e2e/              ← E2E test specs
│   └── 📁 api/              ← API test specs
├── 📁 performance/          ← k6 load test scripts
├── 📁 ai-workflows/         ← Prompt templates + AI-generated examples
│   ├── test-case-prompts.md
│   └── mcp-demo-notes.md
├── 📁 reports/              ← Allure reports (generated)
├── playwright.config.ts
├── .github/workflows/       ← CI/CD pipeline
│   └── playwright.yml
└── README.md                ← Project overview + setup guide
```

Đây sẽ là câu chuyện mạnh nhất để kể trong phỏng vấn AvePoint, vì nó chứng minh cả tư duy QA lẫn khả năng ứng dụng AI thực tế, không phải chỉ đọc lý thuyết.

---

## Tài nguyên tham khảo

### Tài liệu chuẩn
- **[roadmap.sh QA Engineer](https://roadmap.sh/qa)** — bản đồ tổng quan gốc (bạn đã có)
- **[ISTQB Foundation Level Syllabus](https://www.istqb.org/)** — tài liệu chuẩn hóa thuật ngữ QA quốc tế, nên đọc Chapter 1-2 để nắm định nghĩa chính xác
- **[Ministry of Testing](https://www.ministryoftesting.com/)** — cộng đồng QA lớn, nhiều bài viết thực chiến

### Công cụ Automation
- **[Playwright Official Docs](https://playwright.dev/)** — tài liệu chính chủ cho automation
- **[microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)** — MCP server cho AI-powered browser testing
- **[Postman Learning Center](https://learning.postman.com/)** — API testing

### Performance & Security
- **[k6 Documentation](https://k6.io/docs/)** — load testing bằng JS
- **[OWASP Top 10](https://owasp.org/www-project-top-ten/)** — security testing fundamentals

### Reporting & Management
- **[Allure Report](https://allurereport.org/)** — test reporting
- **[TestRail](https://www.testrail.com/)** — test management

### AI-Powered QA (đọc thêm)
- **[Applitools](https://applitools.com/)** — visual AI testing
- Tìm keyword: "AI-powered test automation 2026", "agentic testing", "LLM for QA"

---

*Roadmap này được tổ chức lại từ file roadmap.sh bạn upload, cá nhân hóa theo nền tảng dev sẵn có và định hướng AI-Powered QA Trainee. Review bổ sung: bug lifecycle, severity/priority, ISTQB principles, test design techniques (EP, BVA, Decision Table, State Transition), API/SQL fundamentals, POM pattern, automation pyramid, flaky tests, prompt templates, interview questions, và project demo structure. Có thể chỉnh sửa trực tiếp file này khi học tới đâu, tick checkbox tới đó.*

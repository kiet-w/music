# 01 — Bắt đầu & Lộ trình học (Start Here)

## Mục tiêu
Nắm được lộ trình học QA toàn diện từ con số 0 đến AI-Powered QA Engineer, hiểu cấu trúc 15 module học theo độ phụ thuộc (dependency), chuẩn bị máy móc, công cụ và mindset học tập.

---

## 🗺️ Lộ trình tổng quan (15 Modules theo Dependency)

![AI-Powered QA Learning Path](diagrams/learning-map.svg)

Lộ trình được sắp xếp theo thứ tự **cái trước là nền móng cho cái sau**:

| Folder | Tên Chặng / Module | Nội dung trọng tâm | Độ ưu tiên |
|---|---|---|---|
| **01-start-here** | Bắt đầu & Lộ trình | Tổng quan, môi trường, hướng dẫn học | 🔴 Cao |
| **02-qa-foundations** | QA Mindset & Tư duy | QA vs QC vs Testing, Verification/Validation, ISTQB 7 principles | 🔴 Cao |
| **03-test-design-and-techniques** | Kỹ thuật thiết kế test | 6 Kỹ thuật chọn test case (EP, BVA, Decision Table...), Positive/Negative | 🔴 Cao |
| **04-manual-testing-workflow** | Quy trình Manual Test | Viết Test Case, Bug Report chuẩn, Test Plan, RTM | 🔴 Cao |
| **05-sdlc-stlc-agile** | Quy trình dự án | SDLC, STLC, Agile/Scrum, Definition of Done (DoD) | 🟡 Trung bình |
| **06-tools-and-workflow** | Công cụ & DevTools | DevTools cho QA, Jira/Trello workflow, TestRail, Docker | 🟡 Trung bình |
| **07-web-and-api-basics** | Web & API Fundamentals | SSR vs CSR, Hydration, HTTP Methods, Status Codes, API Checklist | 🔴 Cao |
| **08-automation-foundations** | Automation Nền tảng | Test Pyramid, Automation Strategy, Playwright Core (Locators, Waits) | 🔴 Cao |
| **09-ai-powered-qa** | ⭐ AI-Powered QA | Prompt RCFCO, AI sinh test/code, Playwright MCP, Agentic Testing | 🔴 Cao nhất |
| **10-practice-projects** | Dự án thực hành | Bài tập E2E trên Next.js app, SauceDemo, TodoMVC | 🔴 Cao |
| **11-advanced-manual-qa** | Manual Nâng cao | Exploratory Testing (SBET), Bug Advocacy, Pair Testing với Dev | 🟡 Trung bình |
| **12-api-and-database-testing** | API & Database Testing | Playwright Request API, SQL cho QA (data integrity verification) | 🔴 Cao |
| **13-specialized-testing** | Non-Functional Testing | Performance (k6), Security (OWASP Top 10), Accessibility (AXE), Mobile | 🟡 Trung bình |
| **14-automation-engineering** | Automation Nâng cao | Page Object Model (POM), Fixtures, Flaky test fix, CI/CD GitHub Actions | 🔴 Cao |
| **15-career-and-real-projects** | Sự nghiệp & Portfolio | Xây dựng Portfolio, 20+ Câu hỏi phỏng vấn mẫu & Đáp án | 🔴 Cao |

---

## ⏱️ Kế hoạch học tập đề xuất (10-12 tuần)

- **Tuần 1-2 (Manual Foundations):** Folder `01` → `05`. Nắm vững tư duy QA, 6 kỹ thuật thiết kế test, viết test case & bug report chuẩn.
- **Tuần 3-4 (Technical Baseline):** Folder `06` → `07`. Đọc DevTools, gọi API Postman/curl, SQL verify data.
- **Tuần 5-7 (Automation Core):** Folder `08` & `14`. Học Playwright (Locators, Actions, POM pattern, Fixtures).
- **Tuần 8-9 (AI-Powered QA):** Folder `09`. Sử dụng AI sinh test case, Playwright MCP server, Agentic testing (Planner-Generator-Healer).
- **Tuần 10-11 (Specialized & CI/CD):** Folder `12` & `13`. k6 performance testing, OWASP security basics, GitHub Actions CI/CD.
- **Tuần 12 (Portfolio & Demo):** Folder `10` & `15`. Hoàn thiện project demo end-to-end, làm bài test phỏng vấn.

---

## 🔧 Thiết lập môi trường

1. **Node.js** (v18 trở lên) & `npm` / `bun`
2. **VS Code** với các Extensions: Playwright Test for VS Code, GitLens, Postman / REST Client
3. **Browser**: Google Chrome, Firefox, Safari (WebKit)
4. **Git & GitHub account** (đã connect SSH hoặc PAT)
5. **AI Tools**: Claude Code / Gemini CLI, Cursor, ChatGPT/Claude web interface

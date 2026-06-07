## 4. System Data Flow
**1. GET `/` (getHello)**
- Flow: Client -> Controller (`getHello()`) -> Service (`getHello()`) -> Trả về chuỗi `'Hello World!'` -> Controller -> Client.

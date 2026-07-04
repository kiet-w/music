#!/usr/bin/env bash
# dev.sh - Khởi động backend + Redis, tự động tắt Redis khi Ctrl+C

set -e

# Màu sắc terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}▶ Khởi động Redis...${NC}"
sudo systemctl start redis-server
echo -e "${GREEN}✅ Redis đang chạy trên port 6379${NC}"

# Hàm dọn dẹp khi thoát (Ctrl+C hoặc kill)
cleanup() {
  echo -e "\n${YELLOW}⏹  Đang tắt Redis...${NC}"
  sudo systemctl stop redis-server
  echo -e "${RED}🛑 Redis đã dừng${NC}"
  exit 0
}

# Bắt tín hiệu thoát: Ctrl+C (SIGINT), kill (SIGTERM)
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}▶ Khởi động NestJS + Python...${NC}\n"

# Chạy concurrently (npm run start:dev), và chờ nó kết thúc
npm run start:dev

# Nếu npm kết thúc tự nhiên (không phải Ctrl+C), cũng tắt Redis
cleanup

#!/usr/bin/env bash
# dev.sh - Khởi động frontend với Turbopack (cache persistent)
#
# Cache hoạt động như Redis:
#   - Lần đầu visit route: compile ~1-2s → lưu vào .next/cache/turbopack
#   - Lần sau (cùng session hoặc restart server): load từ cache ~100-300ms
#   - Chỉ recompile khi file nguồn thực sự thay đổi
#
# Dùng: ./dev.sh
# Clear cache khi cần (thay đổi config lớn): ./dev.sh --reset

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CACHE_DIR="$SCRIPT_DIR/.next/cache/turbopack"

# Flag --reset để xóa cache khi cần
if [[ "$1" == "--reset" ]]; then
  echo -e "${YELLOW}🗑  Đang xóa cache .next...${NC}"
  rm -rf "$SCRIPT_DIR/.next"
  echo -e "${GREEN}✅ Cache đã xóa, sẽ compile lại từ đầu${NC}\n"
elif [ -d "$SCRIPT_DIR/.next" ] && { [ ! -f "$SCRIPT_DIR/.next/routes-manifest.json" ] || [ -d "$SCRIPT_DIR/.next/standalone" ]; }; then
  echo -e "${YELLOW}ℹ Phát hiện .next từ production build, tự động reset cache cho dev mode...${NC}"
  rm -rf "$SCRIPT_DIR/.next"
else
  if [ -d "$CACHE_DIR" ]; then
    CACHE_SIZE=$(du -sh "$CACHE_DIR" 2>/dev/null | cut -f1)
    echo -e "${CYAN}⚡ Dev cache sẵn có ($CACHE_SIZE)...${NC}"
  fi
fi

echo -e "${GREEN}▶ Khởi động Next.js với Turbopack...${NC}\n"

# Chạy dev server
npm run dev

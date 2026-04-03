#!/bin/bash
# 本地调试一键启动脚本
# 支持 Cloudflare D1、R2 等特性

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  OuraPix 本地调试启动器${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 显示使用说明
show_help() {
  echo "用法: $0 [选项]"
  echo ""
  echo "选项:"
  echo "  api       - 仅启动 API Worker"
  echo "  web       - 仅启动 Web 应用"
  echo "  full      - 启动完整环境 (API + Web)"
  echo "  preview   - 启动 Web Preview 模式"
  echo "  check     - 检查环境配置"
  echo "  clean     - 清理本地状态"
  echo "  help      - 显示此帮助"
  echo ""
  echo "示例:"
  echo "  $0 api     # 仅调试 API"
  echo "  $0 web     # 仅调试 Web"
  echo "  $0 full    # 全栈调试"
}

# 检查命令
if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

COMMAND=$1

case $COMMAND in
  api)
    echo -e "${YELLOW}启动 API Worker...${NC}"
    echo -e "${GREEN}API 将在 http://localhost:8787 运行${NC}"
    echo ""
    cd apps/api && pnpm dev
    ;;

  web)
    echo -e "${YELLOW}启动 Web 应用...${NC}"
    echo -e "${GREEN}Web 将在 http://localhost:4001 运行${NC}"
    echo ""
    cd apps/web && pnpm dev
    ;;

  full)
    echo -e "${YELLOW}检查并启动完整调试环境...${NC}"
    echo ""

    # 检查环境
    echo -e "${CYAN}1. 检查环境配置...${NC}"
    node scripts/check-local-dev.js || exit 1
    echo ""

    # 数据库迁移
    echo -e "${CYAN}2. 执行数据库迁移...${NC}"
    pnpm db:migrate:local
    echo ""

    # 启动服务
    echo -e "${CYAN}3. 启动服务...${NC}"
    echo -e "${GREEN}API:  http://localhost:8787${NC}"
    echo -e "${GREEN}Web:  http://localhost:4001${NC}"
    echo ""
    echo -e "${YELLOW}提示: 按 Ctrl+C 停止所有服务${NC}"
    echo ""

    # 使用 turbo 启动多个服务
    pnpm turbo run dev --filter=api --filter=web --parallel
    ;;

  preview)
    echo -e "${YELLOW}启动 Web Preview 模式...${NC}"
    echo -e "${GREEN}使用真实 Workers 运行时本地预览${NC}"
    echo ""
    cd apps/web && pnpm preview
    ;;

  check)
    node scripts/check-local-dev.js
    ;;

  clean)
    echo -e "${YELLOW}清理本地状态...${NC}"
    rm -rf .wrangler/state
    echo -e "${GREEN}✓ 本地状态已清理${NC}"
    echo ""
    echo -e "${YELLOW}提示: 需要重新运行 pnpm db:migrate:local 初始化数据库${NC}"
    ;;

  help|--help|-h)
    show_help
    ;;

  *)
    echo -e "${YELLOW}未知命令: $COMMAND${NC}"
    show_help
    exit 1
    ;;
esac

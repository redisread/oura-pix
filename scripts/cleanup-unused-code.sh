#!/bin/bash

# 清理项目中的无用代码
# 使用方法：./scripts/cleanup-unused-code.sh

set -e

echo "🧹 开始清理项目中的无用代码..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$ROOT_DIR/.cleanup-backup"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo -e "${GREEN}ℹ️  $1${NC}"
}

echo_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

echo_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo ""
echo "======================================"
echo "步骤 1: 清理 knip 报告的未使用文件"
echo "======================================"

# 备份并删除 knip 报告的未使用源文件
UNUSED_FILES=(
    # 根目录废弃的 lib 文件 (已迁移到 apps/)
    "lib/ai-generation.ts"
    "lib/ai/gemini.ts"
    "lib/ai/imagen.ts"
    "lib/api/generations.ts"
    "lib/blog.ts"
    "lib/auth-client.ts"
    
    # 根目录废弃的配置文件 (已迁移到 apps/)
    "instrumentation.ts"
    "i18n/config.ts"
    
    # 根目录废弃的 db 文件 (已迁移到 packages/database)
    "db/index.ts"
    "db/schema.ts"
    "drizzle.config.ts"
    
    # apps/web 中未使用的文件
    "apps/web/src/lib/api.ts"
    "apps/web/.astro"
    
    # apps/api 中未使用的文件
    "apps/api/src/lib/cloudflare.ts"
    "apps/api/src/services/dashscope.ts"
)

for file in "${UNUSED_FILES[@]}"; do
    if [ -e "$ROOT_DIR/$file" ]; then
        echo_info "备份并删除：$file"
        if [[ "$file" == */ ]]; then
            # 目录
            mv "$ROOT_DIR/$file" "$BACKUP_DIR/unused-$TIMESTAMP-$(basename "$file")"
        else
            # 文件
            mv "$ROOT_DIR/$file" "$BACKUP_DIR/unused-$TIMESTAMP-$(basename "$file")"
        fi
    fi
done

echo ""
echo "======================================"
echo "步骤 2: 清理构建缓存"
echo "======================================"

# 清理 .wrangler/tmp 缓存
if [ -d "$ROOT_DIR/apps/api/.wrangler/tmp" ]; then
    echo_info "清理 API 构建缓存..."
    rm -rf "$ROOT_DIR/apps/api/.wrangler/tmp"
    mkdir -p "$ROOT_DIR/apps/api/.wrangler/tmp"
fi

if [ -d "$ROOT_DIR/.wrangler/state" ]; then
    echo_info "保留 wrangler state (本地数据库)"
else
    if [ -d "$ROOT_DIR/.wrangler" ]; then
        echo_info "清理根目录 .wrangler 缓存..."
        rm -rf "$ROOT_DIR/.wrangler"
    fi
fi

# 清理 .astro 缓存
if [ -d "$ROOT_DIR/apps/web/.astro" ]; then
    echo_info "清理 Astro 缓存..."
    rm -rf "$ROOT_DIR/apps/web/.astro"
fi

# 清理 .next 缓存
if [ -d "$ROOT_DIR/apps/web/.next" ]; then
    echo_info "清理 Next.js 构建缓存..."
    rm -rf "$ROOT_DIR/apps/web/.next"
fi

# 清理 .turbo 缓存
if [ -d "$ROOT_DIR/.turbo" ]; then
    echo_info "清理 Turbo 缓存..."
    rm -rf "$ROOT_DIR/.turbo"
fi

echo ""
echo "======================================"
echo "步骤 3: 清理临时文件和日志"
echo "======================================"

# 清理临时文件
find "$ROOT_DIR" -type f -name "*.log" ! -path "*/node_modules/*" -delete 2>/dev/null || true
find "$ROOT_DIR" -type f -name "*.tmp" ! -path "*/node_modules/*" -delete 2>/dev/null || true
find "$ROOT_DIR" -type f -name "*.bak" ! -path "*/node_modules/*" -delete 2>/dev/null || true
find "$ROOT_DIR" -type f -name "*.old" ! -path "*/node_modules/*" -delete 2>/dev/null || true

echo_info "清理临时文件完成"

echo ""
echo "======================================"
echo "步骤 4: 清理旧的备份文件（可选）"
echo "======================================"

# 检查是否有超过 30 天的备份文件
if [ -d "$BACKUP_DIR" ]; then
    OLD_BACKUPS=$(find "$BACKUP_DIR" -maxdepth 1 -type d -mtime +30 2>/dev/null | wc -l)
    if [ "$OLD_BACKUPS" -gt 0 ]; then
        echo_warn "发现 $OLD_BACKUPS 个超过 30 天的备份文件"
        echo "这些文件位于：$BACKUP_DIR"
        echo "如需清理，请手动执行：rm -rf $BACKUP_DIR/backup-*"
    fi
fi

echo ""
echo "======================================"
echo "步骤 5: 清理 node_modules (可选)"
echo "======================================"

echo "提示：如需清理 node_modules，请执行以下命令："
echo "  pnpm clean"
echo "  pnpm install"

echo ""
echo "======================================"
echo "✅ 清理完成！"
echo "======================================"
echo ""
echo "备份位置：$BACKUP_DIR"
echo ""
echo "建议执行的后续操作："
echo "  1. 检查项目是否能正常构建：pnpm build"
echo "  2. 检查项目是否能正常运行：pnpm dev"
echo "  3. 运行测试确保功能正常：pnpm test (如果有)"
echo ""
echo "如需恢复清理的文件，请从 $BACKUP_DIR 复制回原位置"

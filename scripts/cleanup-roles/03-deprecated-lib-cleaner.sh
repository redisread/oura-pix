#!/bin/bash
#
# 角色: 废弃 Lib 清理者
# 职责: 识别并清理不再使用的 lib/ 文件
# 原因: 部分工具函数已迁移到 packages/ 或 apps/web/lib/
#

set -e

echo "🔥 [废弃 Lib 清理者] 开始执行..."

TARGET="lib"
BACKUP_DIR=".cleanup-backup/lib-$(date +%Y%m%d-%H%M%S)"
DEPRECATED_FILES=(
    "cloudflare-context.ts"    # 已迁移到 apps/web/lib/
    "auth.ts"                  # 已迁移到 apps/web/lib/
    "source.ts"                # 已迁移到 apps/web/lib/
)

echo "📁 分析目标目录: $TARGET"

if [ ! -d "$TARGET" ]; then
    echo "✅ $TARGET 目录不存在，无需清理"
    exit 0
fi

echo ""
echo "🔍 检查以下文件是否已迁移到 apps/web/lib/:"
for file in "${DEPRECATED_FILES[@]}"; do
    if [ -f "$TARGET/$file" ]; then
        if [ -f "apps/web/lib/$file" ]; then
            echo "  ✅ $file (新位置已存在，可删除)"
        else
            echo "  ⚠️  $file (新位置不存在，保留)"
        fi
    else
        echo "  ℹ️  $file (不存在)"
    fi
done

echo ""
echo "📊 lib/ 目录内容:"
find "$TARGET" -type f -name "*.ts" | head -20

echo ""
echo "⚠️ 注意: 此脚本不会自动删除 lib/ 目录"
echo "   请手动确认哪些文件仍然需要，哪些可以迁移或删除"
echo ""
echo "💡 建议操作:"
echo "  1. 对比 lib/ 和 apps/web/lib/ 的内容"
echo "  2. 将仍在使用的文件迁移到 apps/web/lib/"
echo "  3. 确认无误后手动删除根目录 lib/"

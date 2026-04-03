#!/bin/bash
#
# 角色: API 路由清理者
# 职责: 删除根目录下已废弃的 app/api/ 目录
# 原因: API 已迁移到 apps/api/ (Hono Worker)
#

set -e

echo "🔥 [API 路由清理者] 开始执行..."

TARGET="app/api"
BACKUP_DIR=".cleanup-backup/api-routes-$(date +%Y%m%d-%H%M%S)"

if [ ! -d "$TARGET" ]; then
    echo "✅ $TARGET 目录不存在，无需清理"
    exit 0
fi

echo "📁 发现目标目录: $TARGET"
echo "📊 内容统计:"
find "$TARGET" -type f | wc -l | xargs echo "  - 文件数量:"
du -sh "$TARGET" | xargs echo "  - 总大小:"

echo ""
echo "⚠️  即将执行以下操作:"
echo "  1. 备份 $TARGET 到 $BACKUP_DIR"
echo "  2. 删除 $TARGET 目录"
echo ""

read -p "确认执行? (y/N): " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    echo "❌ 操作已取消"
    exit 0
fi

# 创建备份
mkdir -p "$BACKUP_DIR"
cp -r "$TARGET" "$BACKUP_DIR/"
echo "✅ 备份完成: $BACKUP_DIR"

# 删除目录
rm -rf "$TARGET"
echo "✅ 已删除: $TARGET"

echo ""
echo "🎉 [API 路由清理者] 任务完成!"
echo "💡 提示: 如需恢复，请从备份目录手动还原"

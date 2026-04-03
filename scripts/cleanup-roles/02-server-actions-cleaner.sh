#!/bin/bash
#
# 角色: Server Actions 清理者
# 职责: 检查并清理废弃的 Server Actions
# 原因: 已迁移到 API Client 调用方式
#

set -e

echo "🔥 [Server Actions 清理者] 开始执行..."

TARGET="app/actions"
BACKUP_DIR=".cleanup-backup/server-actions-$(date +%Y%m%d-%H%M%S)"

if [ ! -d "$TARGET" ]; then
    echo "✅ $TARGET 目录不存在，无需清理"
    exit 0
fi

echo "📁 发现目标目录: $TARGET"
echo "📄 文件列表:"
find "$TARGET" -type f -name "*.ts" | while read -r file; do
    echo "  - $file"
done

echo ""
echo "🔍 检查 apps/web/app/actions/ 是否存在..."
if [ -d "apps/web/app/actions" ]; then
    echo "✅ 新位置已存在，根目录下的 actions 可以安全删除"
else
    echo "⚠️  警告: apps/web/app/actions/ 不存在"
    echo "   请确认迁移完成后再执行清理"
    exit 1
fi

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
echo "🎉 [Server Actions 清理者] 任务完成!"

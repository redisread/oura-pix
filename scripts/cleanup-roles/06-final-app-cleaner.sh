#!/bin/bash
#
# 角色: 最终 App 清理者
# 职责: 清理根目录下的 app/ 目录（最后执行）
# 原因: 所有代码已迁移到 apps/web/app/
#

set -e

echo "🔥 [最终 App 清理者] 开始执行..."
echo "⚠️  ⚠️  ⚠️  这是最终清理步骤，请确保之前的清理都已完成！"
echo ""

TARGET="app"
BACKUP_DIR=".cleanup-backup/app-final-$(date +%Y%m%d-%H%M%S)"

if [ ! -d "$TARGET" ]; then
    echo "✅ $TARGET 目录不存在，无需清理"
    exit 0
fi

echo "📁 发现目标目录: $TARGET"
echo ""

# 检查关键子目录是否已清理
if [ -d "$TARGET/api" ]; then
    echo "❌ 错误: app/api/ 仍然存在！"
    echo "   请先执行: ./scripts/cleanup-roles/01-api-routes-cleaner.sh"
    exit 1
fi

if [ -d "$TARGET/actions" ]; then
    echo "❌ 错误: app/actions/ 仍然存在！"
    echo "   请先执行: ./scripts/cleanup-roles/02-server-actions-cleaner.sh"
    exit 1
fi

# 检查新位置
echo "🔍 检查 apps/web/app/ 是否存在..."
if [ ! -d "apps/web/app" ]; then
    echo "❌ 错误: apps/web/app/ 不存在！"
    echo "   请确认迁移完成后再执行此脚本"
    exit 1
fi

new_file_count=$(find "apps/web/app" -type f | wc -l)
echo "✅ 新位置文件数量: $new_file_count"

old_file_count=$(find "$TARGET" -type f | wc -l)
echo "📊 旧位置文件数量: $old_file_count"

echo ""
echo "⚠️  ⚠️  ⚠️  即将删除根目录下的 app/ 目录！"
echo "   此操作不可恢复（除非有备份）"
echo ""

read -p "我确认已备份重要数据并准备删除 (输入 'DELETE'): " confirm
if [[ "$confirm" != "DELETE" ]]; then
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
echo "🎉 [最终 App 清理者] 任务完成!"
echo "🧹 根目录 app/ 已成功清理"

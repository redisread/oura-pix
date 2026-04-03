#!/bin/bash
#
# 角色: Components/Hooks 清理者
# 职责: 检查并清理根目录下的 components/ 和 hooks/
# 原因: 已迁移到 apps/web/components/ 和 apps/web/hooks/
#

set -e

echo "🔥 [Components/Hooks 清理者] 开始执行..."

TARGETS=("components" "hooks")
BACKUP_DIR=".cleanup-backup/components-hooks-$(date +%Y%m%d-%H%M%S)"

echo "📁 检查目标目录..."
echo ""

for target in "${TARGETS[@]}"; do
    if [ -d "$target" ]; then
        echo "📂 $target/"
        file_count=$(find "$target" -type f | wc -l)
        echo "   文件数量: $file_count"
        
        # 检查新位置
        if [ -d "apps/web/$target" ]; then
            new_count=$(find "apps/web/$target" -type f | wc -l)
            echo "   新位置(apps/web/$target/)文件数量: $new_count"
            
            if [ "$file_count" -eq "$new_count" ] || [ "$new_count" -gt 0 ]; then
                echo "   ✅ 新位置已存在，可以清理"
            fi
        else
            echo "   ⚠️  新位置不存在，请先迁移"
        fi
    else
        echo "✅ $target/ 目录不存在"
    fi
    echo ""
done

echo "⚠️ 注意: 此脚本不会自动删除这些目录"
echo "   请确认 apps/web/ 下的对应目录包含所有必要文件后再手动删除"

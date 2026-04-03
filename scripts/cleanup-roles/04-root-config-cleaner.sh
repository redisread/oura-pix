#!/bin/bash
#
# 角色: 根目录配置清理者
# 职责: 清理根目录下不再需要的配置文件
# 原因: 已迁移到 Monorepo 结构，配置分散到各应用
#

set -e

echo "🔥 [根目录配置清理者] 开始执行..."

BACKUP_DIR=".cleanup-backup/root-config-$(date +%Y%m%d-%H%M%S)"

# 定义可能可以清理的文件
OBSOLETE_FILES=(
    "next.config.js"           # 已迁移到 apps/web/next.config.js
    "tailwind.config.ts"       # 已迁移到 apps/web/tailwind.config.ts
    "postcss.config.js"        # 已迁移到 apps/web/postfix.config.js
    "middleware.ts"            # 已迁移到 apps/web/middleware.ts
    "env.d.ts"                 # 已迁移到 apps/web/env.d.ts
    "cloudflare-env.d.ts"      # 已迁移到 apps/web/cloudflare-env.d.ts
    "open-next.config.ts"      # 已迁移到 apps/web/open-next.config.ts
    ".eslintrc.json"           # 已迁移到 apps/web/eslint.config.mjs
    "eslint.config.mjs"        # 同上
)

echo "📋 检查以下文件:"
echo ""

# 检查文件是否存在
found_any=false
for file in "${OBSOLETE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "  📄 $file"
        found_any=true
    fi
done

if [ "$found_any" = false ]; then
    echo "  ✅ 没有发现可清理的配置文件"
    exit 0
fi

echo ""
echo "🔍 检查新位置是否存在对应配置:"
echo ""

# 检查新位置
if [ -f "next.config.js" ] && [ -f "apps/web/next.config.js" ]; then
    echo "  ✅ apps/web/next.config.js 已存在"
fi

if [ -f "tailwind.config.ts" ] && [ -f "apps/web/tailwind.config.ts" ]; then
    echo "  ✅ apps/web/tailwind.config.ts 已存在"
fi

if [ -f "middleware.ts" ] && [ -f "apps/web/middleware.ts" ]; then
    echo "  ✅ apps/web/middleware.ts 已存在"
fi

echo ""
echo "⚠️  警告: 配置文件清理需要谨慎操作"
echo "   建议步骤:"
echo "   1. 确保所有配置都已正确迁移到 apps/web/"
echo "   2. 测试构建: cd apps/web && npm run build"
echo "   3. 确认无误后再删除根目录配置"
echo ""
echo "💡 手动清理命令示例:"
echo "   mkdir -p $BACKUP_DIR"
echo "   mv next.config.js tailwind.config.ts middleware.ts $BACKUP_DIR/"

#!/bin/bash
#
# 代码清理总指挥
# 按顺序执行所有清理角色脚本
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROLES_DIR="$SCRIPT_DIR/cleanup-roles"

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║             🧹 历史无用代码清理总指挥 🧹                      ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📋 清理计划:"
echo "   1. API 路由清理者      - 删除旧 app/api/"
echo "   2. Server Actions 清理者 - 删除旧 app/actions/"
echo "   3. 废弃 Lib 清理者     - 检查 lib/ 冗余文件"
echo "   4. 根目录配置清理者    - 检查配置文件"
echo "   5. Components/Hooks 清理者 - 检查组件目录"
echo "   6. 最终 App 清理者     - 删除旧 app/"
echo ""

read -p "选择操作: [1-6] 执行单个角色, [all] 执行全部, [list] 查看详情, [q] 退出: " choice

case "$choice" in
    1)
        bash "$ROLES_DIR/01-api-routes-cleaner.sh"
        ;;
    2)
        bash "$ROLES_DIR/02-server-actions-cleaner.sh"
        ;;
    3)
        bash "$ROLES_DIR/03-deprecated-lib-cleaner.sh"
        ;;
    4)
        bash "$ROLES_DIR/04-root-config-cleaner.sh"
        ;;
    5)
        bash "$ROLES_DIR/05-components-hooks-cleaner.sh"
        ;;
    6)
        bash "$ROLES_DIR/06-final-app-cleaner.sh"
        ;;
    all|ALL)
        echo "🚀 开始执行所有清理角色..."
        echo ""
        for i in {1..6}; do
            script=$(printf "$ROLES_DIR/%02d-*.sh" $i)
            if [ -f $script ]; then
                echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
                bash $script
                echo ""
            fi
        done
        echo "🎉 所有清理角色执行完毕!"
        ;;
    list|LIST|ls)
        echo "📜 可用清理角色:"
        ls -1 "$ROLES_DIR"/[0-9][0-9]-*.sh | while read -r f; do
            name=$(basename "$f")
            desc=$(head -3 "$f" | tail -1 | sed 's/# //')
            echo "   $name - $desc"
        done
        ;;
    q|Q|quit|exit)
        echo "👋 再见!"
        exit 0
        ;;
    *)
        echo "❌ 无效选项: $choice"
        exit 1
        ;;
esac

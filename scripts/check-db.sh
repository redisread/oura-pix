#!/bin/bash

# ============================================
# 数据库状态检查脚本
# ============================================

echo "🔍 检查本地 D1 数据库..."
echo ""

# 查找最新的数据库文件
DB_DIR=".wrangler/state/v3/d1/miniflare-D1DatabaseObject"
if [ ! -d "$DB_DIR" ]; then
  echo "❌ 未找到数据库目录: $DB_DIR"
  echo "💡 提示: 请先运行 'npm run dev' 或 'npm run db:migrate' 初始化数据库"
  exit 1
fi

DB_FILE=$(ls -t "$DB_DIR"/*.sqlite 2>/dev/null | head -1)

if [ -z "$DB_FILE" ]; then
  echo "❌ 未找到数据库文件"
  echo "💡 提示: 请先运行 'npm run db:migrate' 初始化数据库"
  exit 1
fi

echo "📂 数据库文件: $DB_FILE"
echo ""

# 检查数据库文件大小
FILE_SIZE=$(du -h "$DB_FILE" | cut -f1)
echo "📊 文件大小: $FILE_SIZE"
echo ""

# 检查表
echo "📋 数据库表列表:"
TABLES=$(sqlite3 "$DB_FILE" ".tables")
if [ -z "$TABLES" ]; then
  echo "⚠️  数据库为空，未找到任何表"
  echo "💡 提示: 请运行 'npm run db:migrate' 应用数据库迁移"
else
  echo "$TABLES" | tr ' ' '\n' | while read -r table; do
    if [ -n "$table" ]; then
      COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM $table" 2>/dev/null || echo "0")
      echo "  ✓ $table ($COUNT 条记录)"
    fi
  done
fi
echo ""

# 检查迁移记录
echo "🔄 数据库迁移历史:"
MIGRATIONS=$(sqlite3 "$DB_FILE" "SELECT name, applied_at FROM d1_migrations ORDER BY applied_at DESC LIMIT 5" 2>/dev/null || echo "")
if [ -z "$MIGRATIONS" ]; then
  echo "  ⚠️  未找到迁移记录"
else
  echo "$MIGRATIONS" | while IFS='|' read -r name applied_at; do
    echo "  ✓ $name (应用于: $applied_at)"
  done
fi
echo ""

echo "✅ 数据库检查完成"

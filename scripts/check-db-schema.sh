#!/bin/bash
# 检查数据库表结构与 schema.ts 的一致性

echo "🔍 检查数据库表结构..."
echo ""

# 获取所有表结构
for table in user account session verificationToken generations images subscriptions usage_logs; do
  echo "📋 表: $table"
  npx wrangler d1 execute oura-pix-db --remote --command="PRAGMA table_info($table);" 2>&1 | grep -E '"name":' | sed 's/.*"name": "\([^"]*\)".*/  - \1/'
  echo ""
done

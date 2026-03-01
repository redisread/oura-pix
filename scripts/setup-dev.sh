#!/bin/bash

# ============================================
# 开发环境初始化脚本
# ============================================

set -e  # 遇到错误立即退出

echo "🚀 开始初始化开发环境..."

# 检查 Node.js 版本
echo "📦 检查 Node.js 版本..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Node.js 版本必须 >= 18.0.0，当前版本: $(node -v)"
  exit 1
fi
echo "✅ Node.js 版本检查通过: $(node -v)"

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
else
  echo "✅ 依赖已安装"
fi

# 检查环境变量文件
echo "🔍 检查环境变量配置..."
if [ ! -f ".env.local" ]; then
  if [ -f ".env.example" ]; then
    echo "📝 从 .env.example 创建 .env.local..."
    cp .env.example .env.local
    echo "⚠️  请编辑 .env.local 文件，填入必要的环境变量"
  else
    echo "⚠️  未找到 .env.local 文件，请手动创建"
  fi
else
  echo "✅ .env.local 已存在"
fi

# 检查数据库迁移目录
echo "🔍 检查数据库迁移..."
if [ -d "drizzle/migrations" ]; then
  MIGRATION_COUNT=$(ls -1 drizzle/migrations/*.sql 2>/dev/null | wc -l)
  if [ "$MIGRATION_COUNT" -gt 0 ]; then
    echo "📦 发现 $MIGRATION_COUNT 个数据库迁移文件"
    echo "🔄 应用数据库迁移..."
    npm run db:migrate
    echo "✅ 数据库迁移完成"
  else
    echo "⚠️  未找到数据库迁移文件"
  fi
else
  echo "⚠️  未找到 drizzle/migrations 目录"
fi

# 检查 Cloudflare 配置
echo "🔍 检查 Cloudflare 配置..."
if [ -f "wrangler.toml" ]; then
  echo "✅ wrangler.toml 配置文件存在"
else
  echo "⚠️  未找到 wrangler.toml 配置文件"
fi

echo ""
echo "✨ 开发环境初始化完成！"
echo ""
echo "📝 下一步操作:"
echo "   1. 检查并编辑 .env.local 文件"
echo "   2. 运行 'npm run dev' 启动开发服务器"
echo "   3. 访问 http://localhost:4001"
echo ""

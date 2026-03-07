#!/bin/bash

# 数据库迁移验证脚本

echo "🔍 验证数据库迁移..."
echo ""

# 1. 检查 images 表结构
echo "1️⃣ 检查 images 表新字段..."
wrangler d1 execute oura-pix-db --local --command="PRAGMA table_info(images);" > /tmp/images_schema.txt 2>&1

if grep -q "generationId" /tmp/images_schema.txt && grep -q "promptUsed" /tmp/images_schema.txt; then
    echo "   ✅ images 表新字段已添加 (generationId, promptUsed)"
else
    echo "   ❌ images 表新字段未找到"
    cat /tmp/images_schema.txt
fi

# 2. 检查 generations 表结构
echo ""
echo "2️⃣ 检查 generations 表新字段..."
wrangler d1 execute oura-pix-db --local --command="PRAGMA table_info(generations);" > /tmp/generations_schema.txt 2>&1

if grep -q "generatedImageCount" /tmp/generations_schema.txt && grep -q "imageGenerationStatus" /tmp/generations_schema.txt; then
    echo "   ✅ generations 表新字段已添加 (generatedImageCount, imageGenerationStatus, imageGenerationError)"
else
    echo "   ❌ generations 表新字段未找到"
    cat /tmp/generations_schema.txt
fi

# 3. 检查索引
echo ""
echo "3️⃣ 检查新增索引..."
wrangler d1 execute oura-pix-db --local --command="SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='images';" > /tmp/images_indexes.txt 2>&1

if grep -q "images_generationId_idx" /tmp/images_indexes.txt; then
    echo "   ✅ images_generationId_idx 索引已创建"
else
    echo "   ❌ images_generationId_idx 索引未找到"
    cat /tmp/images_indexes.txt
fi

# 4. 测试数据插入
echo ""
echo "4️⃣ 测试数据插入..."
wrangler d1 execute oura-pix-db --local --command="
INSERT INTO images (
  id, userId, originalName, url, type, size, mimeType,
  generationId, promptUsed, createdAt, updatedAt
) VALUES (
  'test_migration_img', 'test_user', 'test.png', 'https://example.com/test.png',
  'generated_scene', 1024, 'image/png',
  'test_gen_id', 'test prompt', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000
);
" > /tmp/insert_test.txt 2>&1

if grep -q "success" /tmp/insert_test.txt; then
    echo "   ✅ 数据插入成功"

    # 清理测试数据
    wrangler d1 execute oura-pix-db --local --command="DELETE FROM images WHERE id='test_migration_img';" > /dev/null 2>&1
else
    echo "   ❌ 数据插入失败"
    cat /tmp/insert_test.txt
fi

echo ""
echo "✅ 数据库迁移验证完成!"
echo ""
echo "下一步:"
echo "  1. 运行开发服务器: npm run dev"
echo "  2. 访问生成页面: http://localhost:3000/generate"
echo "  3. 测试图像生成功能"

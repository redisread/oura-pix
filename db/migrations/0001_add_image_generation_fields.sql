-- 添加图像生成相关字段
-- Migration: 0001_add_image_generation_fields
-- Date: 2026-03-05

-- 1. 修改 images 表,添加新字段
-- 注意: SQLite 不支持直接修改枚举,需要重建表

-- 添加 generationId 字段
ALTER TABLE images ADD COLUMN generationId TEXT REFERENCES generations(id) ON DELETE SET NULL;

-- 添加 promptUsed 字段
ALTER TABLE images ADD COLUMN promptUsed TEXT;

-- 创建索引以提升查询性能
CREATE INDEX IF NOT EXISTS images_generationId_idx ON images(generationId);

-- 2. 修改 generations 表,添加图像生成相关字段

-- 添加生成的场景图数量
ALTER TABLE generations ADD COLUMN generatedImageCount INTEGER DEFAULT 0;

-- 添加图像生成状态
ALTER TABLE generations ADD COLUMN imageGenerationStatus TEXT CHECK(imageGenerationStatus IN ('pending', 'processing', 'completed', 'failed', 'skipped'));

-- 添加图像生成错误信息
ALTER TABLE generations ADD COLUMN imageGenerationError TEXT;

-- 注意: 由于 SQLite 的限制,无法直接修改 type 字段的枚举值
-- 需要在应用层面处理 'generated_scene' 类型
-- 或者在下次完整迁移时重建 images 表

-- 创建临时表来重建 images 表以支持新的类型枚举
CREATE TABLE images_new (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  originalName TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('product', 'reference', 'generated_scene')),
  size INTEGER NOT NULL,
  mimeType TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  generationId TEXT REFERENCES generations(id) ON DELETE SET NULL,
  promptUsed TEXT,
  isDeleted INTEGER DEFAULT 0,
  deletedAt INTEGER,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- 复制数据
INSERT INTO images_new
SELECT
  id, userId, originalName, url, type, size, mimeType, width, height,
  NULL as generationId, NULL as promptUsed,
  isDeleted, deletedAt, createdAt, updatedAt
FROM images;

-- 删除旧表
DROP TABLE images;

-- 重命名新表
ALTER TABLE images_new RENAME TO images;

-- 重建索引
CREATE INDEX images_userId_isDeleted_idx ON images(userId, isDeleted);
CREATE INDEX images_generationId_idx ON images(generationId);

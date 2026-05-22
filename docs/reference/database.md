# 数据库迁移指南

## Imagen 3 功能数据库迁移

### 迁移概述

本次迁移为 Imagen 3 商品场景图生成功能添加必要的数据库字段。

**迁移文件**: `/db/migrations/0001_add_image_generation_fields.sql`

### 变更内容

#### 1. `images` 表

**新增字段**:
- `generationId` (TEXT): 关联的生成任务 ID
- `promptUsed` (TEXT): 生成此图片使用的提示词

**修改字段**:
- `type`: 枚举值新增 `'generated_scene'` (生成的场景图)

**新增索引**:
- `images_generationId_idx`: 优化按生成任务查询图片的性能

#### 2. `generations` 表

**新增字段**:
- `generatedImageCount` (INTEGER): 生成的场景图数量,默认 0
- `imageGenerationStatus` (TEXT): 图像生成状态
  - 可选值: `'pending'`, `'processing'`, `'completed'`, `'failed'`, `'skipped'`
- `imageGenerationError` (TEXT): 图像生成错误信息

---

## 迁移步骤

### 方式 1: 使用 Wrangler (推荐)

适用于 Cloudflare D1 数据库。

#### 本地开发环境

```bash
# 执行迁移
wrangler d1 execute ourapix-dev --local --file=db/migrations/0001_add_image_generation_fields.sql

# 验证迁移
wrangler d1 execute ourapix-dev --local --command="SELECT * FROM sqlite_master WHERE type='table' AND name='images';"
```

#### 生产环境

```bash
# 1. 备份数据库 (重要!)
wrangler d1 export ourapix-prod --output=backup_$(date +%Y%m%d_%H%M%S).sql

# 2. 执行迁移
wrangler d1 execute ourapix-prod --file=db/migrations/0001_add_image_generation_fields.sql

# 3. 验证迁移
wrangler d1 execute ourapix-prod --command="PRAGMA table_info(images);"
wrangler d1 execute ourapix-prod --command="PRAGMA table_info(generations);"
```

### 方式 2: 使用 Drizzle Kit

适用于使用 Drizzle ORM 的项目。

```bash
# 1. 生成迁移文件 (已完成)
npx drizzle-kit generate:sqlite

# 2. 推送到数据库
npx drizzle-kit push:sqlite

# 3. 验证
npx drizzle-kit introspect:sqlite
```

### 方式 3: 手动执行 SQL

如果使用其他 SQLite 客户端:

```bash
# 使用 sqlite3 命令行工具
sqlite3 /path/to/database.db < db/migrations/0001_add_image_generation_fields.sql

# 验证
sqlite3 /path/to/database.db "PRAGMA table_info(images);"
```

---

## 验证迁移

### 1. 检查表结构

```sql
-- 检查 images 表
PRAGMA table_info(images);

-- 应包含以下新字段:
-- generationId (TEXT)
-- promptUsed (TEXT)

-- 检查 generations 表
PRAGMA table_info(generations);

-- 应包含以下新字段:
-- generatedImageCount (INTEGER)
-- imageGenerationStatus (TEXT)
-- imageGenerationError (TEXT)
```

### 2. 检查索引

```sql
-- 检查 images 表索引
SELECT * FROM sqlite_master WHERE type='index' AND tbl_name='images';

-- 应包含:
-- images_generationId_idx
```

### 3. 测试数据插入

```sql
-- 测试插入 generated_scene 类型图片
INSERT INTO images (
  id, userId, originalName, url, type, size, mimeType,
  generationId, promptUsed, createdAt, updatedAt
) VALUES (
  'test_img_1', 'user_123', 'test.png', 'https://example.com/test.png',
  'generated_scene', 1024, 'image/png',
  'gen_123', 'test prompt', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000
);

-- 测试更新 generations 表
UPDATE generations
SET
  generatedImageCount = 5,
  imageGenerationStatus = 'completed'
WHERE id = 'test_gen_id';

-- 清理测试数据
DELETE FROM images WHERE id = 'test_img_1';
```

---

## 回滚方案

如果迁移出现问题,可以回滚到之前的状态。

### 回滚 SQL

```sql
-- 1. 删除新增的字段 (SQLite 不支持 DROP COLUMN,需要重建表)

-- 备份当前数据
CREATE TABLE images_backup AS SELECT * FROM images;
CREATE TABLE generations_backup AS SELECT * FROM generations;

-- 重建 images 表 (不包含新字段)
DROP TABLE images;
CREATE TABLE images (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  originalName TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('product', 'reference')),
  size INTEGER NOT NULL,
  mimeType TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  isDeleted INTEGER DEFAULT 0,
  deletedAt INTEGER,
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);

-- 恢复数据 (排除新字段)
INSERT INTO images
SELECT
  id, userId, originalName, url, type, size, mimeType, width, height,
  isDeleted, deletedAt, createdAt, updatedAt
FROM images_backup
WHERE type IN ('product', 'reference');

-- 重建索引
CREATE INDEX images_userId_isDeleted_idx ON images(userId, isDeleted);

-- 删除备份表
DROP TABLE images_backup;

-- 2. 对 generations 表做类似操作
-- (省略,逻辑相同)
```

---

## 常见问题

### Q1: 迁移时报错 "table images already exists"

**原因**: 迁移脚本尝试重建表,但表已存在。

**解决方案**:
```bash
# 检查当前表结构
wrangler d1 execute ourapix-dev --local --command="PRAGMA table_info(images);"

# 如果已包含新字段,说明迁移已执行,无需重复执行
```

### Q2: 生产环境数据丢失

**预防措施**:
- 迁移前**必须**备份数据库
- 先在本地/测试环境验证迁移
- 使用 Wrangler 的 `--dry-run` 选项预览

**恢复方案**:
```bash
# 从备份恢复
wrangler d1 import ourapix-prod --file=backup_20260305_120000.sql
```

### Q3: 迁移后应用报错 "no such column: generationId"

**原因**: 应用代码已更新,但数据库未迁移。

**解决方案**:
1. 确认迁移已执行: `PRAGMA table_info(images);`
2. 如果未执行,立即执行迁移
3. 重启应用服务

### Q4: 如何在不停机的情况下迁移?

**策略**: 向后兼容迁移

1. **第一阶段**: 添加新字段 (允许 NULL)
   ```sql
   ALTER TABLE images ADD COLUMN generationId TEXT;
   ALTER TABLE images ADD COLUMN promptUsed TEXT;
   ```

2. **第二阶段**: 部署新代码 (使用新字段,但优雅处理 NULL)

3. **第三阶段**: 数据回填 (如果需要)
   ```sql
   UPDATE images SET generationId = 'legacy' WHERE generationId IS NULL;
   ```

4. **第四阶段**: 添加约束 (如果需要)

---

## 迁移清单

执行迁移前,请确认以下事项:

- [ ] 已阅读迁移文件内容
- [ ] 已在本地环境测试迁移
- [ ] 已备份生产数据库
- [ ] 已通知团队成员
- [ ] 已准备回滚方案
- [ ] 已更新应用代码以使用新字段
- [ ] 已验证迁移成功
- [ ] 已更新文档

---

## 相关文档

- [Imagen 3 实施文档](../IMAGEN_IMPLEMENTATION.md)
- [Imagen API 使用指南](./imagen-api-guide.md)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Drizzle ORM 迁移文档](https://orm.drizzle.team/docs/migrations)

---

**最后更新**: 2026-03-05
**迁移版本**: 0001
**状态**: 待执行

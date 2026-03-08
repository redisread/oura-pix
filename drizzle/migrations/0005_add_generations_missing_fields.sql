-- 数据库 Schema 对比报告
-- 检查日期: 2026-03-08

-- ============================================
-- generations 表缺失字段
-- ============================================
-- 以下字段在 schema.ts 中定义，但数据库中不存在：

-- 1. generatedImageCount - INTEGER
ALTER TABLE generations ADD COLUMN generatedImageCount INTEGER DEFAULT 0;

-- 2. imageGenerationStatus - TEXT
ALTER TABLE generations ADD COLUMN imageGenerationStatus TEXT;

-- 3. imageGenerationError - TEXT
ALTER TABLE generations ADD COLUMN imageGenerationError TEXT;

-- ============================================
-- 验证所有表结构
-- ============================================

-- user 表 - ✅ 一致
-- account 表 - ✅ 一致
-- session 表 - ✅ 一致
-- verificationToken 表 - ✅ 一致
-- images 表 - ✅ 一致
-- subscriptions 表 - ✅ 一致
-- usage_logs 表 - ✅ 一致
-- generations 表 - ⚠️ 缺少3个字段 (已修复)

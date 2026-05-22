# 无用代码清理指南

本文档说明如何清理项目中的无用代码和文件。

## 📋 目录

1. [快速开始](#快速开始)
2. [清理工具](#清理工具)
3. [清理内容](#清理内容)
4. [注意事项](#注意事项)
5. [故障排除](#故障排除)

---

## 🚀 快速开始

### 1. 分析无用代码

```bash
# 运行分析工具（可选）
node scripts/analyze-unused.js
```

### 2. 执行清理

```bash
# 执行清理脚本
./scripts/cleanup-unused-code.sh
```

### 3. 验证清理结果

```bash
# 重新运行 knip 检查
npx knip --include files,dependencies

# 构建项目验证
pnpm build

# 本地测试
pnpm dev
```

---

## 🛠️ 清理工具

### 1. analyze-unused.js

**功能**: 分析项目中的无用代码

**用法**:
```bash
node scripts/analyze-unused.js
```

**输出**:
- knip 分析报告
- 大目录大小统计
- 可能的无用文件列表
- 生成 CLEANUP_REPORT.md 报告

### 2. cleanup-unused-code.sh

**功能**: 执行实际清理操作

**用法**:
```bash
./scripts/cleanup-unused-code.sh
```

**清理内容**:
- knip 报告的未使用文件
- 构建缓存 (.wrangler, .next, .astro, .turbo)
- 临时文件 (*.log, *.tmp, *.bak, *.old)

**备份**:
所有清理的文件都会备份到 `.cleanup-backup/` 目录

---

## 🗑️ 清理内容

### 根目录废弃文件

以下文件已从根目录迁移到 apps/ 子项目，可以安全删除：

```
lib/ai-generation.ts        # 已迁移
lib/ai/gemini.ts            # 已迁移
lib/ai/imagen.ts            # 已迁移
lib/api/generations.ts      # 已迁移
lib/blog.ts                 # 已迁移
lib/auth-client.ts          # 已迁移
instrumentation.ts          # 已迁移
i18n/config.ts              # 已迁移
db/index.ts                 # 已迁移到 packages/database
db/schema.ts                # 已迁移到 packages/database
drizzle.config.ts           # 已迁移到 packages/database
```

### 构建缓存

```
apps/api/.wrangler/tmp/     # API 构建缓存
apps/web/.next/             # Web 构建产物
apps/web/.astro/            # Web Astro 缓存
.turbo/                     # Turbo 缓存
```

### 临时文件

```
*.log                       # 日志文件
*.tmp                       # 临时文件
*.bak                       # 备份文件
*.old                       # 旧版本文件
```

---

## ⚠️ 注意事项

### 1. 备份

清理脚本会自动备份所有删除的文件到：
```
.cleanup-backup/unused-YYYYMMDD-HHMMSS-<filename>
```

如需恢复文件：
```bash
cp .cleanup-backup/unused-YYYYMMDD-HHMMSS-<filename> <original-path>
```

### 2. 保留的文件

以下文件**不应该**删除：

- `.wrangler/state/` - 本地 D1 数据库状态
- `node_modules/` - 依赖包（使用 `pnpm clean` 清理）
- `.cleanup-backup/` - 备份目录（手动清理）

### 3. 清理顺序

建议的清理顺序：

1. ✅ 运行 `node scripts/analyze-unused.js` 分析
2. ✅ 查看分析报告
3. ✅ 执行 `./scripts/cleanup-unused-code.sh`
4. ✅ 运行 `pnpm build` 验证
5. ✅ 运行 `pnpm dev` 测试

---

## 🔧 故障排除

### 问题 1: 清理后构建失败

**解决方案**:
```bash
# 1. 检查错误信息
pnpm build 2>&1 | tee build-error.log

# 2. 从备份恢复可能的文件
ls -la .cleanup-backup/

# 3. 重新安装依赖
pnpm clean
pnpm install

# 4. 重新构建
pnpm build
```

### 问题 2: 找不到某些模块

**解决方案**:
```bash
# 检查是否是误删的文件
grep -r "from 'lib/xxx'" apps/ --include="*.ts" --include="*.tsx"

# 如果确实需要，从备份恢复
cp .cleanup-backup/unused-*-* .
```

### 问题 3: knip 仍然报告很多未使用文件

**解决方案**:
```bash
# 1. 更新 knip 配置
# 编辑 knip.config.js，添加需要忽略的文件

# 2. 重新运行分析
npx knip --include files,dependencies --no-exit-code

# 3. 手动检查是否真的未使用
```

### 问题 4: 脚本没有执行权限

**解决方案**:
```bash
chmod +x scripts/cleanup-unused-code.sh
chmod +x scripts/analyze-unused.js
```

---

## 📊 定期清理建议

### 每周清理

```bash
# 清理构建缓存
pnpm clean

# 重新安装依赖
pnpm install
```

### 每月清理

```bash
# 运行完整分析
node scripts/analyze-unused.js

# 执行清理
./scripts/cleanup-unused-code.sh

# 验证项目
pnpm build && pnpm dev
```

### 季度清理

```bash
# 清理旧的备份文件（保留最近 3 个月的备份）
find .cleanup-backup -type d -mtime +90 -exec rm -rf {} \;

# 检查依赖
pnpm outdated

# 更新依赖
pnpm up
```

---

## 📚 相关资源

- [knip 文档](https://knip.dev/)
- [Turborepo 文档](https://turbo.build/repo/docs)
- [项目清理最佳实践](docs/cleanup-best-practices.md)

---

**最后更新**: 2026-04-05

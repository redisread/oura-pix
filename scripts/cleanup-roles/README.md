# 代码清理角色说明

本目录包含一系列"清理角色"脚本，用于分阶段清理 Monorepo 迁移后的历史无用代码。

## 清理角色列表

| 序号 | 角色名称 | 脚本 | 职责 | 风险等级 |
|------|----------|------|------|----------|
| 1 | API 路由清理者 | `01-api-routes-cleaner.sh` | 删除旧 `app/api/` 目录 | 🟡 中 |
| 2 | Server Actions 清理者 | `02-server-actions-cleaner.sh` | 删除旧 `app/actions/` 目录 | 🟡 中 |
| 3 | 废弃 Lib 清理者 | `03-deprecated-lib-cleaner.sh` | 检查并提示清理 `lib/` | 🟢 低 |
| 4 | 根目录配置清理者 | `04-root-config-cleaner.sh` | 检查并提示清理配置文件 | 🟢 低 |
| 5 | Components/Hooks 清理者 | `05-components-hooks-cleaner.sh` | 检查并提示清理组件/钩子 | 🟢 低 |
| 6 | 最终 App 清理者 | `06-final-app-cleaner.sh` | 删除旧 `app/` 目录 | 🔴 高 |

## 使用方法

### 方式一: 使用总控脚本（推荐）

```bash
# 进入项目根目录
cd /Users/victor/.superset/worktrees/oura-pix/wave-territory

# 启动总控
./scripts/cleanup-master.sh

# 根据提示选择:
# - 输入 1-6 执行单个角色
# - 输入 all 执行全部
# - 输入 list 查看详情
```

### 方式二: 直接执行单个角色

```bash
# 执行特定角色
bash scripts/cleanup-roles/01-api-routes-cleaner.sh
```

## 清理顺序建议

**阶段 1 - 安全清理（低风险）**
1. 先执行 03、04、05 进行检查，确认需要清理的内容

**阶段 2 - 功能迁移（中风险）**
2. 执行 01 清理 API 路由（已确定迁移到 apps/api/）
3. 执行 02 清理 Server Actions（已确定迁移到 apps/web/app/actions/）

**阶段 3 - 最终清理（高风险）**
4. 确认 apps/web/app/ 完全可用后，执行 06 清理根目录 app/

## 注意事项

- ⚠️ 所有删除操作前都会自动创建备份到 `.cleanup-backup/`
- ⚠️ 执行前请确保 `apps/web/` 和 `apps/api/` 可以正常构建和运行
- ⚠️ 建议先在一个分支上执行清理，验证无误后再合并
- ⚠️ 最终 App 清理者(06)需要输入 'DELETE' 确认，防止误操作

## 备份恢复

如果清理后发现问题，可以从备份恢复：

```bash
# 查看备份
ls -la .cleanup-backup/

# 恢复特定目录（示例）
cp -r .cleanup-backup/api-routes-20260320-120000/app/api ./app/
```

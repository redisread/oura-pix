# 本地调试快速参考

## 快速开始

```bash
# 一键启动完整环境
./scripts/dev.sh full

# 或分别启动
pnpm api:dev    # 终端 1: 启动 API
pnpm web:dev    # 终端 2: 启动 Web
```

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `pnpm debug:check` | 检查环境配置是否就绪 |
| `pnpm db:migrate:local` | 执行 D1 数据库迁移 |
| `pnpm db:studio` | 启动 Drizzle Studio 可视化数据库 |
| `pnpm api:dev` | 启动 API Worker (端口 8787) |
| `pnpm web:dev` | 启动 Web 应用 (端口 4001) |
| `pnpm web:preview` | 在 Workers 运行时中预览 Web |
| `pnpm clean:state` | 清理本地状态 (.wrangler/state) |

## 脚本快捷方式

```bash
./scripts/dev.sh api      # 仅启动 API
./scripts/dev.sh web      # 仅启动 Web
./scripts/dev.sh full     # 启动完整环境
./scripts/dev.sh preview  # 启动 Preview 模式
./scripts/dev.sh check    # 检查环境
./scripts/dev.sh clean    # 清理状态
```

## 服务地址

| 服务 | 本地地址 |
|------|----------|
| API Worker | http://localhost:8787 |
| Web 应用 | http://localhost:4001 |
| Drizzle Studio | https://local.drizzle.studio |

## 环境变量文件

| 文件 | 用途 | 模板 |
|------|------|------|
| `apps/api/.dev.vars` | API Secrets | `.dev.vars.example` |
| `apps/web/.env.local` | Web 环境变量 | `.env.local.example` |

## VS Code 调试

按 `F5` 或 `Ctrl+Shift+D` 打开调试面板，选择配置：

- **Debug: API Worker** - 调试后端 API
- **Debug: Web (Next.js)** - 调试前端应用
- **Debug: Full Stack** - 同时调试 API + Web

## Chrome DevTools 调试 Worker

1. 启动 API: `pnpm api:dev`
2. 打开 Chrome 访问: `chrome://inspect`
3. 配置添加: `localhost:9229`
4. 点击 "inspect" 开始调试

## 故障排除

### D1 数据库连接失败
```bash
# 重新初始化数据库
rm -rf .wrangler/state
pnpm db:migrate:local
```

### 端口冲突
```bash
# 检查端口占用
lsof -i :8787  # API 端口
lsof -i :4001  # Web 端口
```

### 环境变量未生效
```bash
# 检查文件是否存在
ls -la apps/api/.dev.vars
ls -la apps/web/.env.local

# 重启服务
```

## 文档

- 完整调试指南: [docs/LOCAL-DEBUG.md](./docs/LOCAL-DEBUG.md)
- Cloudflare D1 文档: https://developers.cloudflare.com/d1/
- Cloudflare R2 文档: https://developers.cloudflare.com/r2/
- OpenNext Cloudflare: https://opennext.js.org/cloudflare

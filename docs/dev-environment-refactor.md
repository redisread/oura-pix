# 开发环境改造总结

## 改造日期
2026-03-04

## 改造目标
将开发环境从 `wrangler getPlatformProxy` 迁移到 `initOpenNextCloudflareForDev`,符合 OpenNext 官方最佳实践。

## 改造内容

### 1. 新增文件

#### lib/dev-init.ts
- 封装 `initOpenNextCloudflareForDev` 调用逻辑
- 单例模式避免重复初始化
- 仅在开发环境执行

#### lib/with-dev-init.ts
- API Route 初始化包装器 HOC
- 确保在处理请求前完成开发环境初始化
- 统一管理初始化时序

#### lib/init-global.ts
- 全局初始化模块
- 在应用启动时自动初始化开发环境
- 确保 Server Actions 也能访问 Cloudflare context

#### instrumentation.ts
- Next.js Instrumentation Hook
- 在服务器启动时执行全局初始化

### 2. 重构文件

#### lib/cloudflare-context.ts
- **变化**: 完全重写,移除 `getPlatformProxy` 依赖
- **改进**:
  - 统一使用 OpenNext 的 `getCloudflareContext()`
  - 简化代码逻辑,从 191 行减少到约 120 行
  - 移除 `initLocalBindings()` 和 `localBindings` 缓存

#### lib/auth-client.ts
- **问题**: 客户端使用 `process.env.NEXT_PUBLIC_APP_URL` 不可靠
- **修复**:
  - 浏览器环境使用 `window.location.origin` 动态获取
  - SSR 环境才使用环境变量
  - 避免硬编码导致的生产环境问题

#### lib/auth.ts
- **问题**: `trustedOrigins` 硬编码 `http://localhost:4001`
- **修复**:
  - 根据环境动态构建 `trustedOrigins`
  - 生产环境只信任 `baseUrl`
  - 开发环境额外信任 localhost

### 3. 更新 API Routes

所有 API Routes 使用 `withDevInit` 包装:
- `app/api/auth/[...all]/route.ts`
- `app/api/generations/route.ts`
- `app/api/generations/[id]/route.ts`
- `app/api/webhooks/stripe/route.ts`

### 4. 更新配置

#### next.config.js
- 移除 `wrangler` 的 external 配置(不再直接使用 wrangler)
- 保留其他必要的 external 配置(esbuild, sqlite)

## 测试验证

### 开发环境启动测试
```bash
npm run dev
```

**预期输出**:
```
✓ Compiled /instrumentation in 364ms
[dev-init] OpenNext Cloudflare dev environment initialized
✓ Ready in 3.5s
```

### API 功能测试
```bash
curl http://localhost:4001/api/auth/get-session
```

**预期输出**:
```
null
```

**服务器日志**:
```
GET /api/auth/get-session 200 in 27ms
```

## 关键改进

### 1. 符合最佳实践
- 使用 OpenNext 官方推荐的 `initOpenNextCloudflareForDev`
- 统一开发和生产环境的上下文获取机制

### 2. 简化代码
- 移除 wrangler 依赖和复杂的 fallback 逻辑
- 代码行数减少约 40%
- 更易维护和理解

### 3. 修复安全问题
- 移除硬编码的 localhost 地址
- 动态获取客户端 baseURL
- 生产环境配置更安全

### 4. 改善开发体验
- 自动初始化,无需手动管理
- 统一的错误处理和日志
- 更快的启动速度

## 架构变化

### 之前 (getPlatformProxy)
```
API Route → getCloudflareContext()
  ├─ 尝试 OpenNext getCloudflareContext (生产)
  └─ Fallback: wrangler getPlatformProxy (开发)
      └─ 动态导入 wrangler
      └─ 创建 platform proxy
      └─ 缓存 localBindings
```

### 现在 (initOpenNextCloudflareForDev)
```
应用启动 → instrumentation.ts
  └─ lib/init-global.ts
      └─ lib/dev-init.ts
          └─ initOpenNextCloudflareForDev()
              └─ 注入环境变量和 bindings

API Route → withDevInit(handler)
  └─ 确保初始化完成
  └─ handler() → getCloudflareContext()
      └─ OpenNext getCloudflareContext (开发+生产统一)
```

## 依赖变化

### 移除
- 对 `wrangler` 的运行时依赖
- `getPlatformProxy` 相关代码

### 保留
- `@opennextjs/cloudflare` (核心依赖)
- `wrangler.toml` 配置文件(被 initOpenNextCloudflareForDev 读取)
- `.dev.vars` 本地密钥文件

## 注意事项

### 开发环境要求
1. 必须有 `wrangler.toml` 配置文件
2. 必须有 `.dev.vars` 本地密钥文件
3. D1 数据库必须已创建并迁移

### 初始化时序
- `instrumentation.ts` 在应用启动时执行
- `withDevInit` 在每个 API 请求前确保初始化完成
- 使用单例 Promise 避免重复初始化

### 错误处理
- 如果初始化失败,会抛出明确的错误信息
- 开发环境会检查 bindings 是否可用
- 生产环境直接使用 OpenNext context

## 后续优化建议

1. **监控初始化性能**: 跟踪 `initOpenNextCloudflareForDev` 的执行时间
2. **错误恢复机制**: 如果初始化失败,提供降级方案
3. **测试覆盖**: 添加集成测试验证开发环境初始化
4. **文档完善**: 更新开发者文档,说明新的初始化流程

## 参考文档

- [OpenNext for Cloudflare - Get Started](https://opennext.js.org/cloudflare/get-started)
- [OpenNext CLI Documentation](https://opennext.js.org/cloudflare/cli)
- [Cloudflare Workers - Next.js Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Next.js Instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation)

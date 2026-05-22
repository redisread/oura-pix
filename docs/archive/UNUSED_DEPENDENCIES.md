# 未使用依赖分析报告

## 原 apps/web/package.json 依赖检查

### 核心依赖 (需保留)
- ✅ react, react-dom - 已迁移到 frontend
- ✅ next-intl - 替换为 @inlang/paraglide-js
- ✅ tailwindcss - 已迁移
- ✅ axios - 通过 @oura-pix/api-client 使用

### 待确认依赖

```json
{
  "@auth/prisma-adapter": "^2.x",  // 如果后端用 Better Auth，可移除
  "@next/bundle-analyzer": "^15.x", // Next 专用，可移除
  "@next/mdx": "^15.x",            // Next 专用，可移除
  "@radix-ui/react-*": "^1.x",      // 检查是否使用
  "class-variance-authority": "^0.x", // 检查使用
  "clsx": "^2.x",                   // 常用，保留
  "cmdk": "^1.x",                   // Command palette，检查使用
  "embla-carousel-react": "^8.x",  // Carousel，检查使用
  "framer-motion": "^11.x",         // 动画，检查使用
  "next-themes": "^0.x",            // 主题，检查使用
  "sonner": "^1.x",                 // Toast，检查使用
  "tailwind-merge": "^2.x",         // 常用，保留
  "vaul": "^0.x"                    // Drawer，检查使用
}
```

## 组件使用检查

### Radix UI 组件
需要检查 apps/web 中使用的 @radix-ui 组件：

```bash
grep -r "@radix-ui" apps/web/app/components/ | grep import
```

常见组件：
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-tabs
- @radix-ui/react-toast

**迁移建议：**
1. 如使用少，可替换为原生实现
2. 如使用多，保留依赖

### 动画库 (framer-motion)
检查使用场景：
```bash
grep -r "framer-motion" apps/web/app/
grep -r "motion\." apps/web/app/
```

### 其他 UI 组件
- embla-carousel-react: 轮播组件
- cmdk: Command palette
- vaul: Drawer 组件
- sonner: Toast 通知

## 清理建议

### Phase 3.1 (profile 完成后)

1. **删除 apps/web/**
2. **检查并移除未使用的根依赖**
3. **更新 pnpm-workspace.yaml**

### Phase 3.2 (验证后)

1. **清理 node_modules**
2. **更新 lock 文件**
3. **验证构建**

## 依赖统计

### frontend 当前依赖

```bash
cd frontend && cat package.json | jq '.dependencies | keys'
```

结果：
- @astrojs/cloudflare
- @astrojs/react
- @astrojs/tailwind
- @auth/core
- @oura-pix/api-client
- astro
- auth-astro
- axios
- lucide-react
- react
- react-dom
- tailwindcss
- zustand

### 建议添加 (如需)

- sonner (toast 通知)
- framer-motion (动画)
- @radix-ui/react-dialog (modal)

## 最终目标

单 frontend 包依赖，无 apps/web 残留。

# 安全修复：认证逻辑缺陷

## 问题描述

在原有代码中，所有Server Actions都使用了伪造的请求对象来获取用户会话，导致无法正确传递用户认证信息：

```typescript
// ❌ 错误的实现
const request = new Request("http://localhost", {
  headers: { cookie: "" }, // Cookie被硬编码为空字符串
});
```

这会导致以下问题：
1. **认证失败**：所有需要认证的操作都会返回"Unauthorized"错误
2. **安全风险**：无法正确验证用户身份
3. **功能失效**：图片上传、生成任务创建、历史记录查询等功能全部无法使用

## 修复方案

使用Next.js提供的`headers()`函数获取真实的请求头，包括cookie信息：

```typescript
// ✅ 正确的实现
import { headers } from "next/headers";

// 获取真实的请求头
const headersList = await headers();
const cookie = headersList.get("cookie") || "";

const request = new Request("http://localhost", {
  headers: { cookie },
});
```

## 修复的文件

### 1. `app/actions/create-generation.ts`
- **函数**: `createGeneration()`
- **影响**: 创建AI生成任务功能

### 2. `app/actions/upload-image.ts`
- **函数**:
  - `uploadImage()` - 图片上传
  - `deleteImage()` - 图片删除
  - `getUserImages()` - 获取用户图片列表

### 3. `app/actions/get-generation.ts`
- **函数**:
  - `getGeneration()` - 获取生成任务详情
  - `retryGeneration()` - 重试失败的生成任务
  - `cancelGeneration()` - 取消生成任务

### 4. `app/actions/get-history.ts`
- **函数**:
  - `getHistory()` - 获取生成历史记录
  - `deleteGeneration()` - 删除生成记录
  - `exportHistory()` - 导出历史记录

## 技术细节

### Next.js Server Actions 中的认证

在Next.js 15的Server Actions中，正确的认证流程应该是：

1. **导入headers函数**
   ```typescript
   import { headers } from "next/headers";
   ```

2. **获取请求头**
   ```typescript
   const headersList = await headers();
   const cookie = headersList.get("cookie") || "";
   ```

3. **创建Request对象**
   ```typescript
   const request = new Request("http://localhost", {
     headers: { cookie },
   });
   ```

4. **验证用户**
   ```typescript
   const auth = createAuth(env.DB);
   const user = await getCurrentUser(auth, request);
   ```

### Better Auth 会话验证

项目使用Better Auth进行认证，会话信息存储在名为`ourapix.session`的HTTP-only cookie中。`getCurrentUser()`函数会：

1. 从cookie中提取会话令牌
2. 验证令牌的有效性
3. 从数据库查询用户信息
4. 返回用户对象或null

## 测试验证

修复后，以下功能应该能正常工作：

- ✅ 用户登录后可以上传图片
- ✅ 用户可以创建AI生成任务
- ✅ 用户可以查看生成任务详情和进度
- ✅ 用户可以查看和管理历史记录
- ✅ 用户可以删除图片和生成记录

## 相关文件

- `lib/auth.ts` - 认证配置和辅助函数
- `lib/cloudflare-context.ts` - Cloudflare环境上下文
- `db/schema.ts` - 数据库Schema定义

## 注意事项

1. **开发环境**：确保`.env.local`中配置了正确的`AUTH_SECRET`
2. **Cookie安全**：生产环境会自动启用HTTPS和secure cookie
3. **会话过期**：默认会话有效期为7天，每24小时自动刷新

## 后续改进建议

1. **错误处理优化**：区分不同的认证失败原因（未登录、会话过期、权限不足）
2. **日志记录**：添加认证失败的审计日志
3. **性能优化**：考虑缓存会话信息，减少数据库查询
4. **测试覆盖**：添加认证相关的单元测试和集成测试

## 修复日期

2026-03-01

## 修复人员

Claude (AI Assistant)

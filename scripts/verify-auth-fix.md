# 认证修复验证指南

## 快速验证步骤

### 1. 启动开发服务器

```bash
npm run dev
```

服务器应该在 `http://localhost:4001` 启动

### 2. 测试用户注册和登录

1. **注册新用户**
   - 访问：http://localhost:4001/register
   - 填写邮箱和密码（密码至少8个字符）
   - 点击注册按钮
   - 应该成功创建账户并自动登录

2. **登录测试**
   - 访问：http://localhost:4001/login
   - 输入注册时的邮箱和密码
   - 点击登录按钮
   - 应该成功登录并跳转到首页

### 3. 测试认证功能

#### 3.1 图片上传功能

1. 登录后访问：http://localhost:4001/generate
2. 点击"上传图片"或拖拽图片到上传区域
3. **预期结果**：
   - ✅ 图片成功上传
   - ✅ 显示图片预览
   - ✅ 可以看到上传的文件名和尺寸
   - ❌ 不应该出现"Unauthorized"错误

#### 3.2 生成任务创建

1. 上传至少一张商品图片
2. （可选）上传参考图片
3. 填写生成提示词（可选）
4. 点击"开始生成"按钮
5. **预期结果**：
   - ✅ 成功创建生成任务
   - ✅ 显示任务进度
   - ✅ 可以看到任务ID和状态
   - ❌ 不应该出现"Unauthorized"错误

#### 3.3 历史记录查询

1. 访问：http://localhost:4001/dashboard/history（或相应的历史页面）
2. **预期结果**：
   - ✅ 能看到之前创建的生成任务
   - ✅ 显示任务状态、时间等信息
   - ✅ 可以点击查看任务详情
   - ❌ 不应该出现"Unauthorized"错误

### 4. 浏览器开发者工具检查

打开浏览器开发者工具（F12），切换到以下标签页：

#### 4.1 Network 标签

1. 执行上传图片操作
2. 查找上传请求（通常是POST到`/api/...`）
3. **检查请求头**：
   - ✅ 应该包含`Cookie`头
   - ✅ Cookie中应该包含`ourapix.session=...`
   - ❌ Cookie不应该是空的

#### 4.2 Application 标签

1. 左侧菜单选择 Storage → Cookies → http://localhost:4001
2. **检查Cookie**：
   - ✅ 应该能看到`ourapix.session` cookie
   - ✅ HttpOnly应该为true
   - ✅ SameSite应该为Lax
   - ✅ 应该有过期时间（7天后）

#### 4.3 Console 标签

1. 执行各种操作（上传、创建任务等）
2. **检查错误**：
   - ❌ 不应该出现"Unauthorized"错误
   - ❌ 不应该出现认证相关的错误
   - ✅ 可能有其他错误（如Stripe未配置），但不应该是认证问题

### 5. 后端日志检查

在运行`npm run dev`的终端中：

1. **成功的认证日志**：
   ```
   # 不应该看到这些错误
   ❌ "Unauthorized"
   ❌ "User not found"
   ❌ "Invalid session"
   ```

2. **正常的操作日志**：
   ```
   ✅ 上传成功的日志
   ✅ 创建任务的日志
   ✅ 查询数据的日志
   ```

### 6. 数据库验证

使用Drizzle Studio查看数据库：

```bash
npm run db:studio
```

访问：http://localhost:4983

**检查表数据**：
1. `users` 表 - 应该有注册的用户
2. `sessions` 表 - 应该有活跃的会话记录
3. `images` 表 - 应该有上传的图片记录
4. `generations` 表 - 应该有创建的生成任务

### 7. 常见问题排查

#### 问题1：仍然显示"Unauthorized"

**可能原因**：
- 没有重启开发服务器
- 浏览器缓存问题
- Cookie被阻止

**解决方法**：
```bash
# 1. 停止开发服务器 (Ctrl+C)
# 2. 清除浏览器Cookie
# 3. 重新启动
npm run dev
# 4. 重新登录测试
```

#### 问题2：Cookie不存在

**可能原因**：
- 登录失败
- AUTH_SECRET未配置
- 数据库连接问题

**解决方法**：
```bash
# 1. 检查环境变量
cat .env.local | grep AUTH_SECRET

# 2. 如果没有，生成新的
openssl rand -base64 32

# 3. 添加到.env.local
echo "AUTH_SECRET=<生成的密钥>" >> .env.local

# 4. 重启服务器
```

#### 问题3：数据库错误

**可能原因**：
- 数据库未初始化
- 迁移未运行

**解决方法**：
```bash
# 1. 运行数据库迁移
npm run db:migrate

# 2. 如果还有问题，重新生成迁移
npm run db:generate
npm run db:migrate
```

## 自动化测试（可选）

如果想编写自动化测试，可以使用以下代码示例：

```typescript
// tests/auth.test.ts
import { describe, it, expect } from 'vitest';

describe('Authentication Fix', () => {
  it('should pass cookie to getCurrentUser', async () => {
    // 模拟带cookie的请求
    const mockHeaders = new Headers({
      cookie: 'ourapix.session=test-session-token'
    });

    // 验证Request对象包含cookie
    const request = new Request('http://localhost', {
      headers: mockHeaders
    });

    expect(request.headers.get('cookie')).toBe('ourapix.session=test-session-token');
  });
});
```

## 验证完成清单

- [ ] 用户可以成功注册
- [ ] 用户可以成功登录
- [ ] 登录后可以上传图片
- [ ] 可以创建生成任务
- [ ] 可以查看历史记录
- [ ] 浏览器中存在session cookie
- [ ] 请求头包含正确的cookie
- [ ] 没有"Unauthorized"错误
- [ ] 数据库中有对应的记录

## 修复确认

如果以上所有测试都通过，说明认证逻辑修复成功！✅

## 相关文档

- 详细修复说明：`SECURITY_FIX.md`
- 待办事项：`TODO.md`
- 架构文档：`ARCHITECTURE.md`

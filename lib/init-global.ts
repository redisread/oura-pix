/**
 * 全局初始化模块
 *
 * 在应用启动时自动初始化开发环境
 * 确保所有 Server Actions 和 API Routes 都能访问 Cloudflare context
 */

import { initDevEnvironment } from './dev-init';

// 在模块加载时立即初始化(仅开发环境)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  // 异步初始化,但不阻塞模块加载
  initDevEnvironment().catch((error) => {
    console.error('[init-global] Failed to initialize development environment:', error);
  });
}

// 导出一个空对象以满足模块导入
export {};

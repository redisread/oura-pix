/**
 * 开发环境初始化 HOC
 *
 * 包装 API Route handler,确保在处理请求前完成开发环境初始化
 */

import { initDevEnvironment } from './dev-init';

type Handler = (...args: any[]) => Promise<Response>;

let initPromise: Promise<void> | null = null;

export function withDevInit(handler: Handler): Handler {
  return async (...args: any[]) => {
    // 开发环境确保初始化完成
    if (process.env.NODE_ENV === 'development') {
      if (!initPromise) {
        initPromise = initDevEnvironment();
      }
      await initPromise;
    }

    return handler(...args);
  };
}

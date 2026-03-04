/**
 * Next.js Instrumentation Hook
 *
 * 在服务器启动时执行,用于初始化全局配置
 * 文档: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // 只在服务器端运行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 导入全局初始化模块,触发开发环境初始化
    await import('./lib/init-global');
  }
}

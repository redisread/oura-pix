/**
 * Development Environment Initialization
 *
 * 使用 OpenNext 的 initOpenNextCloudflareForDev 初始化本地开发环境
 * 仅在开发环境运行，生产环境会被 tree-shaking 优化掉
 */

let initialized = false;

export async function initDevEnvironment(): Promise<void> {
  // 只在开发环境且未初始化时执行
  if (process.env.NODE_ENV !== 'development' || initialized) {
    return;
  }

  try {
    const { initOpenNextCloudflareForDev } = await import(
      /* webpackIgnore: true */
      "@opennextjs/cloudflare"
    );

    await initOpenNextCloudflareForDev({
      // 指定 wrangler.toml 路径
      configPath: "./wrangler.toml",
    });

    initialized = true;
    console.log("[dev-init] OpenNext Cloudflare dev environment initialized");
  } catch (error) {
    console.error("[dev-init] Failed to initialize dev environment:", error);
    throw error;
  }
}

/**
 * OpenNext Cloudflare Configuration
 *
 * This configuration enables deploying Next.js to Cloudflare Pages
 * using OpenNext's Cloudflare adapter.
 *
 * @see https://opennext.js.org/cloudflare
 */

import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // 使用 "dummy" 增量缓存（适用于静态站点或无 ISR 需求）
  // 如需启用 R2 增量缓存，参考：
  // https://opennext.js.org/cloudflare/caching/incremental-cache
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "direct",
});
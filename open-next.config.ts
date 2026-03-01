/**
 * OpenNext Cloudflare Configuration
 *
 * This configuration enables deploying Next.js to Cloudflare Pages
 * using OpenNext's Cloudflare adapter.
 *
 * @see https://opennext.js.org/cloudflare
 */

import type { OpenNextConfig } from "@opennextjs/cloudflare";

const config: OpenNextConfig = {
  default: {
    override: {
      wrapper: "cloudflare-node",
    },
  },
};

export default config;
import { defineMiddleware } from "astro:middleware";

import { paraglideMiddleware } from "./paraglide/server.js";

export const onRequest = defineMiddleware((context, next) => {
  const pathname = new URL(context.request.url).pathname;
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_astro/") ||
    pathname === "/favicon.svg"
  ) {
    return next();
  }

  return paraglideMiddleware(context.request, ({ request }) => next(request));
});

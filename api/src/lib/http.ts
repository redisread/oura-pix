/**
 * Standardized HTTP error response helpers.
 *
 * Every protected route was re-implementing the same { success: false, error: { code, message } }
 * payload (~57 occurrences). These helpers centralise that shape so error responses
 * stay consistent and route handlers stay focused on business logic.
 */

import type { Context } from "hono";
import { apiMessage } from "./i18n";

export function badRequest(c: Context, key = "badRequest", details?: unknown) {
  return c.json(
    {
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: apiMessage(c, key),
        ...(details ? { details } : {}),
      },
    },
    400
  );
}

export function unauthorized(c: Context) {
  return c.json(
    {
      success: false,
      error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") },
    },
    401
  );
}

export function forbidden(c: Context) {
  return c.json(
    {
      success: false,
      error: { code: "FORBIDDEN", message: apiMessage(c, "forbidden") },
    },
    403
  );
}

export function notFound(c: Context, key = "notFound") {
  return c.json(
    {
      success: false,
      error: { code: "NOT_FOUND", message: apiMessage(c, key) },
    },
    404
  );
}

export function internalError(c: Context) {
  return c.json(
    {
      success: false,
      error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") },
    },
    500
  );
}

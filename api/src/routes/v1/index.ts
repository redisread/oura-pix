/**
 * Public API v1 — Root
 *
 * Mounts all v1 sub-routes. All routes require API Key auth.
 */

import { Hono } from "hono";
import generate from "./generate";

const v1 = new Hono();

v1.route("/generate", generate);
// Aliases for nicer URL shape: /api/v1/generation/:id → /api/v1/generate/:id
v1.route("/generation", generate);

export default v1;

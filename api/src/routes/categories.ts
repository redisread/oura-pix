/**
 * Categories Routes
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import { resolveLocale, serverMessage, type Locale } from "@oura-pix/i18n";
import { getUser } from "../middleware/auth";
import {
  listCategories, getCategory, listCategoryTemplates,
  createUserTemplate, listUserTemplates, deleteUserTemplate,
} from "../services/categoryService";

const categories = new Hono<{
  Bindings: { DB: D1Database };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
    locale?: Locale;
  };
}>();

function getLocale(c: { req: { raw: Request } }): Locale {
  return resolveLocale({ headers: c.req.raw.headers });
}

categories.get("/", async (c) => {
  const locale = getLocale(c);
  try {
    const db = createDb(c.env.DB);
    const data = await listCategories(db, locale);
    return c.json({ success: true, data });
  } catch { return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: serverMessage(locale, "internalError") } }, 500); }
});

categories.get("/:id", async (c) => {
  const locale = getLocale(c);
  const id = c.req.param("id");
  try {
    const db = createDb(c.env.DB);
    const cat = await getCategory(db, id, locale);
    if (!cat) return c.json({ success: false, error: { code: "NOT_FOUND", message: serverMessage(locale, "notFound") } }, 404);
    return c.json({ success: true, data: cat });
  } catch { return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: serverMessage(locale, "internalError") } }, 500); }
});

categories.get("/:id/templates", async (c) => {
  const locale = getLocale(c);
  const id = c.req.param("id");
  try {
    const db = createDb(c.env.DB);
    const data = await listCategoryTemplates(db, id, locale);
    return c.json({ success: true, data });
  } catch { return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: serverMessage(locale, "internalError") } }, 500); }
});

const createTemplateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.object({
    targetPlatform: z.enum(["amazon", "ebay", "shopify", "etsy", "generic"]).optional(),
    language: z.enum(["zh", "en", "ja"]).optional(),
    style: z.enum(["professional", "lifestyle", "minimal", "luxury"]).optional(),
    count: z.number().int().min(1).max(10).optional(),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional(),
    allowPersons: z.boolean().optional(),
    imageCount: z.number().int().min(1).max(10).optional(),
  }),
});

const validateCreateTemplate = zValidator("json", createTemplateSchema, (result, c) => {
  if (!result.success) {
    const locale = getLocale(c);
    return c.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: serverMessage(locale, "badRequest"),
          details: result.error.flatten(),
        },
      },
      400
    );
  }
});

categories.post("/templates", validateCreateTemplate, async (c) => {
  const locale = getLocale(c);
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: serverMessage(locale, "unauthorized") } }, 401);
  const input = c.req.valid("json");
  try {
    const db = createDb(c.env.DB);
    const created = await createUserTemplate(db, user.id, input);
    return c.json({ success: true, data: created }, 201);
  } catch { return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: serverMessage(locale, "internalError") } }, 500); }
});

categories.get("/templates/mine", async (c) => {
  const locale = getLocale(c);
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: serverMessage(locale, "unauthorized") } }, 401);
  try {
    const db = createDb(c.env.DB);
    const data = await listUserTemplates(db, user.id);
    return c.json({ success: true, data });
  } catch { return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: serverMessage(locale, "internalError") } }, 500); }
});

categories.delete("/templates/:id", async (c) => {
  const locale = getLocale(c);
  const user = await getUser(c);
  if (!user) return c.json({ success: false, error: { code: "UNAUTHORIZED", message: serverMessage(locale, "unauthorized") } }, 401);
  const id = c.req.param("id");
  try {
    const db = createDb(c.env.DB);
    const ok = await deleteUserTemplate(db, id, user.id);
    if (!ok) return c.json({ success: false, error: { code: "NOT_FOUND", message: serverMessage(locale, "templateNotFound") } }, 404);
    return c.json({ success: true });
  } catch { return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: serverMessage(locale, "internalError") } }, 500); }
});

export default categories;

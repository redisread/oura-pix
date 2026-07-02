/**
 * Categories Routes
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { getLocale } from "../lib/i18n";
import { serverMessage } from "@oura-pix/i18n";
import { createRouter, useCtx } from "../lib/route";
import { notFound } from "../lib/http";
import {
  listCategories, getCategory, listCategoryTemplates,
  createUserTemplate, listUserTemplates, deleteUserTemplate,
} from "../services/categoryService";

const categories = createRouter();

categories.get("/", async (c) => {
  const { db } = useCtx(c);
  const locale = getLocale(c);
  const data = await listCategories(db, locale);
  return c.json({ success: true, data });
});

categories.get("/:id", async (c) => {
  const { db } = useCtx(c);
  const locale = getLocale(c);
  const id = c.req.param("id");
  const cat = await getCategory(db, id, locale);
  if (!cat) return notFound(c);
  return c.json({ success: true, data: cat });
});

categories.get("/:id/templates", async (c) => {
  const { db } = useCtx(c);
  const locale = getLocale(c);
  const id = c.req.param("id");
  const data = await listCategoryTemplates(db, id, locale);
  return c.json({ success: true, data });
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
          details: z.flattenError(result.error),
        },
      },
      400
    );
  }
});

categories.post("/templates", validateCreateTemplate, async (c) => {
  const { user, db } = useCtx(c);
  const input = c.req.valid("json");
  const created = await createUserTemplate(db, user.id, input);
  return c.json({ success: true, data: created }, 201);
});

categories.get("/templates/mine", async (c) => {
  const { user, db } = useCtx(c);
  const data = await listUserTemplates(db, user.id);
  return c.json({ success: true, data });
});

categories.delete("/templates/:id", async (c) => {
  const { user, db } = useCtx(c);
  const id = c.req.param("id");
  const ok = await deleteUserTemplate(db, id, user.id);
  if (!ok) return notFound(c, "templateNotFound");
  return c.json({ success: true });
});

export default categories;

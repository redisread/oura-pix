/**
 * Categories Routes
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb } from "@oura-pix/database";
import { getUser } from "../middleware/auth";
import {
  listCategories, getCategory, listCategoryTemplates,
  createUserTemplate, listUserTemplates, deleteUserTemplate,
} from "../services/categoryService";

const categories = new Hono<{
  Bindings: { DB: D1Database };
  Variables: { user: { id: string; email: string; name?: string | null }; session: { id: string; expiresAt: Date } };
}>();

categories.get("/", async (c) => {
  try {
    const db = createDb(c.env.DB);
    const data = await listCategories(db);
    return c.json({ success: true, data });
  } catch { return c.json({ error: "Failed to list categories" }, 500); }
});

categories.get("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    const db = createDb(c.env.DB);
    const cat = await getCategory(db, id);
    if (!cat) return c.json({ error: "Category not found" }, 404);
    return c.json({ success: true, data: cat });
  } catch { return c.json({ error: "Failed to get category" }, 500); }
});

categories.get("/:id/templates", async (c) => {
  const id = c.req.param("id");
  try {
    const db = createDb(c.env.DB);
    const data = await listCategoryTemplates(db, id);
    return c.json({ success: true, data });
  } catch { return c.json({ error: "Failed to list templates" }, 500); }
});

const createTemplateSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.object({
    targetPlatform: z.enum(["amazon", "ebay", "shopify", "etsy", "generic"]).optional(),
    language: z.string().max(10).optional(),
    style: z.enum(["professional", "lifestyle", "minimal", "luxury"]).optional(),
    count: z.number().int().min(1).max(10).optional(),
    aspectRatio: z.enum(["1:1", "3:4", "4:3", "9:16", "16:9"]).optional(),
    allowPersons: z.boolean().optional(),
    imageCount: z.number().int().min(1).max(10).optional(),
  }),
});

categories.post("/templates", zValidator("json", createTemplateSchema), async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const input = c.req.valid("json");
  try {
    const db = createDb(c.env.DB);
    const created = await createUserTemplate(db, user.id, input);
    return c.json({ success: true, data: created }, 201);
  } catch { return c.json({ error: "Failed to create template" }, 500); }
});

categories.get("/templates/mine", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  try {
    const db = createDb(c.env.DB);
    const data = await listUserTemplates(db, user.id);
    return c.json({ success: true, data });
  } catch { return c.json({ error: "Failed to list templates" }, 500); }
});

categories.delete("/templates/:id", async (c) => {
  const user = await getUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("id");
  try {
    const db = createDb(c.env.DB);
    const ok = await deleteUserTemplate(db, id, user.id);
    if (!ok) return c.json({ error: "Template not found or is a preset" }, 404);
    return c.json({ success: true });
  } catch { return c.json({ error: "Failed to delete template" }, 500); }
});

export default categories;

/**
 * Category & Template Service
 */

import { createDb, schema, type TemplateSettings } from "@oura-pix/database";
import { eq, and, asc, desc, sql } from "drizzle-orm";

export interface CategoryRecord {
  id: string;
  name: string;
  description: string;
  icon: string;
  bestPractices: string | null;
  sortOrder: number;
  createdAt: Date;
  templateCount?: number;
}

export interface TemplateRecord {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  settings: TemplateSettings;
  isPreset: boolean;
  createdBy: string | null;
  usageCount: number;
  createdAt: Date;
}

export const SEED_CATEGORIES: Array<Omit<CategoryRecord, "id" | "createdAt" | "templateCount">> = [
  { name: "服装", description: "服装、鞋帽、配件等穿戴类商品", icon: "👕", sortOrder: 1, bestPractices: "## 服装类目最佳实践\n\n### 详情页结构\n- 模特展示图（1-2 张）\n- 细节特写（面料、做工、五金）\n- 尺码对照表\n- 搭配建议\n- 洗涤说明\n\n### 文案风格\n- 强调材质和工艺\n- 真实场景展示" },
  { name: "电子产品", description: "手机、配件、智能设备等", icon: "📱", sortOrder: 2, bestPractices: "## 电子产品最佳实践\n\n### 详情页结构\n- 产品多角度图\n- 核心参数对比\n- 适用场景演示\n- 包装清单" },
  { name: "美妆", description: "彩妆、护肤、香水等", icon: "💄", sortOrder: 3, bestPractices: "## 美妆类目最佳实践\n\n### 详情页结构\n- 真人上脸/上妆效果\n- 成分解析\n- 持久度测试\n- 肤色适配范围" },
  { name: "食品", description: "零食、饮料、调味品等", icon: "🍪", sortOrder: 4, bestPractices: "## 食品类目最佳实践\n\n### 详情页结构\n- 产品包装正面\n- 配料表\n- 营养成分表\n- 食用场景" },
  { name: "家居", description: "家具、装饰、收纳等", icon: "🏠", sortOrder: 5, bestPractices: "## 家居类目最佳实践\n\n### 详情页结构\n- 整体场景图\n- 尺寸标注\n- 材质细节\n- 空间搭配示例" },
];

export const SEED_TEMPLATES: Array<{ categoryName: string; name: string; description: string; settings: TemplateSettings }> = [
  { categoryName: "服装", name: "白底主图 + 模特图", description: "Amazon 主图风格", settings: { targetPlatform: "amazon", style: "professional", count: 5, aspectRatio: "1:1" } },
  { categoryName: "服装", name: "生活场景图", description: "Lifestyle 风格", settings: { targetPlatform: "shopify", style: "lifestyle", count: 8, aspectRatio: "4:3" } },
  { categoryName: "服装", name: "细节特写组", description: "聚焦做工细节", settings: { targetPlatform: "shopify", style: "minimal", count: 5, aspectRatio: "1:1" } },
  { categoryName: "电子产品", name: "产品多角度图", description: "四角度展示", settings: { targetPlatform: "amazon", style: "professional", count: 5, aspectRatio: "1:1" } },
  { categoryName: "电子产品", name: "使用场景演示", description: "实际应用", settings: { targetPlatform: "shopify", style: "lifestyle", count: 6, aspectRatio: "16:9" } },
  { categoryName: "电子产品", name: "参数对比图", description: "突出技术参数", settings: { targetPlatform: "amazon", style: "professional", count: 4, aspectRatio: "1:1" } },
  { categoryName: "美妆", name: "上脸效果展示", description: "真人上妆对比", settings: { targetPlatform: "shopify", style: "lifestyle", count: 6, aspectRatio: "4:3", allowPersons: true } },
  { categoryName: "美妆", name: "产品特写", description: "包装、质地", settings: { targetPlatform: "amazon", style: "minimal", count: 5, aspectRatio: "1:1" } },
  { categoryName: "美妆", name: "奢华场景图", description: "Luxury 风格", settings: { targetPlatform: "etsy", style: "luxury", count: 5, aspectRatio: "1:1" } },
  { categoryName: "食品", name: "产品包装正面", description: "突出品牌品名", settings: { targetPlatform: "amazon", style: "professional", count: 4, aspectRatio: "1:1" } },
  { categoryName: "食品", name: "食用场景", description: "真实使用场景", settings: { targetPlatform: "shopify", style: "lifestyle", count: 6, aspectRatio: "4:3" } },
  { categoryName: "食品", name: "配料成分图", description: "突出天然原料", settings: { targetPlatform: "amazon", style: "minimal", count: 4, aspectRatio: "1:1" } },
  { categoryName: "家居", name: "空间搭配图", description: "整体家居搭配", settings: { targetPlatform: "shopify", style: "lifestyle", count: 6, aspectRatio: "16:9" } },
  { categoryName: "家居", name: "产品细节图", description: "材质做工", settings: { targetPlatform: "amazon", style: "professional", count: 5, aspectRatio: "1:1" } },
  { categoryName: "家居", name: "多色多款展示", description: "配套组合", settings: { targetPlatform: "etsy", style: "luxury", count: 8, aspectRatio: "1:1" } },
];

export async function ensureSeedData(db: ReturnType<typeof createDb>): Promise<void> {
  const existing = await db.select().from(schema.categories).limit(1);
  if (existing.length > 0) return;

  const nameToId = new Map<string, string>();
  for (const cat of SEED_CATEGORIES) {
    const [created] = await db
      .insert(schema.categories)
      .values({ name: cat.name, description: cat.description, icon: cat.icon, bestPractices: cat.bestPractices, sortOrder: cat.sortOrder, createdAt: new Date() })
      .returning();
    nameToId.set(cat.name, created!.id);
  }
  for (const t of SEED_TEMPLATES) {
    const id = nameToId.get(t.categoryName);
    if (!id) continue;
    await db.insert(schema.templates).values({
      categoryId: id, name: t.name, description: t.description, settings: t.settings, isPreset: true, createdBy: null, usageCount: 0, createdAt: new Date(),
    });
  }
}

export async function listCategories(db: ReturnType<typeof createDb>): Promise<CategoryRecord[]> {
  await ensureSeedData(db);
  const rows = await db
    .select({
      id: schema.categories.id, name: schema.categories.name, description: schema.categories.description,
      icon: schema.categories.icon, bestPractices: schema.categories.bestPractices, sortOrder: schema.categories.sortOrder,
      createdAt: schema.categories.createdAt, templateCount: sql<number>`count(${schema.templates.id})`,
    })
    .from(schema.categories)
    .leftJoin(schema.templates, eq(schema.templates.categoryId, schema.categories.id))
    .groupBy(schema.categories.id)
    .orderBy(asc(schema.categories.sortOrder));
  return rows.map((r) => ({ ...r, templateCount: r.templateCount }));
}

export async function getCategory(db: ReturnType<typeof createDb>, id: string): Promise<CategoryRecord | null> {
  await ensureSeedData(db);
  const rows = await db.select().from(schema.categories).where(eq(schema.categories.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function listCategoryTemplates(db: ReturnType<typeof createDb>, categoryId: string): Promise<TemplateRecord[]> {
  await ensureSeedData(db);
  return db
    .select()
    .from(schema.templates)
    .where(eq(schema.templates.categoryId, categoryId))
    .orderBy(desc(schema.templates.isPreset), desc(schema.templates.usageCount));
}

export async function createUserTemplate(
  db: ReturnType<typeof createDb>, userId: string,
  input: { categoryId: string; name: string; description?: string; settings: TemplateSettings }
): Promise<TemplateRecord> {
  const [created] = await db.insert(schema.templates).values({
    categoryId: input.categoryId, name: input.name, description: input.description ?? null,
    settings: input.settings, isPreset: false, createdBy: userId, usageCount: 0, createdAt: new Date(),
  }).returning();
  return created!;
}

export async function listUserTemplates(db: ReturnType<typeof createDb>, userId: string): Promise<TemplateRecord[]> {
  return db
    .select()
    .from(schema.templates)
    .where(and(eq(schema.templates.createdBy, userId), eq(schema.templates.isPreset, false)))
    .orderBy(desc(schema.templates.createdAt));
}

export async function incrementTemplateUsage(db: ReturnType<typeof createDb>, templateId: string): Promise<void> {
  await db.update(schema.templates).set({ usageCount: sql`${schema.templates.usageCount} + 1` }).where(eq(schema.templates.id, templateId)).catch((err) => console.error("Failed to increment template usage:", err));
}

export async function deleteUserTemplate(db: ReturnType<typeof createDb>, templateId: string, userId: string): Promise<boolean> {
  const result = await db
    .delete(schema.templates)
    .where(and(eq(schema.templates.id, templateId), eq(schema.templates.createdBy, userId), eq(schema.templates.isPreset, false)))
    .returning();
  return result.length > 0;
}

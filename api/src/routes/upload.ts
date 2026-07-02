/**
 * Upload Routes
 *
 * Handle image uploads to R2
 */

import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { schema } from "@oura-pix/database";
import { createRouter, useCtx } from "../lib/route";
import { badRequest } from "../lib/http";

const router = createRouter<{
  R2: R2Bucket;
  CLOUDFLARE_R2_PUBLIC_URL: string;
}>();

const uploadSchema = z.object({
  fileName: z.string(),
  fileType: z.string(),
  type: z.enum(["product", "reference"]),
});

// POST /api/upload/signed-url - Get signed upload URL
router.post(
  "/signed-url",
  zValidator("json", uploadSchema),
  async (c) => {
    const { user } = useCtx(c);

    const { fileName, fileType } = c.req.valid("json");
    const { R2, CLOUDFLARE_R2_PUBLIC_URL } = c.env;

    // Generate unique key
    const ext = fileName.split(".").pop() || "jpg";
    const key = `uploads/${user.id}/${crypto.randomUUID()}.${ext}`;

    // Create R2 upload (validates bucket access)
    await R2.createMultipartUpload(key, {
      httpMetadata: {
        contentType: fileType,
      },
    });

    // Get presigned upload URL (for direct browser upload)
    // Note: For simplicity, we'll do server-side upload instead
    // In production, you might want to use presigned URLs for direct upload

    // For now, return a simple response - client will POST the file directly
    const imageUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    return c.json({
      success: true,
      data: {
        uploadUrl: "/api/upload/direct", // Client will POST here
        imageUrl,
        key,
      },
    });
  }
);

// POST /api/upload/direct - Direct upload to R2
router.post(
  "/direct",
  async (c) => {
    const { user, db } = useCtx(c);

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as "product" | "reference") || "product";

    if (!file) return badRequest(c);

    const { R2, CLOUDFLARE_R2_PUBLIC_URL } = c.env;

    // Generate unique key
    const ext = file.name.split(".").pop() || "jpg";
    const key = `uploads/${user.id}/${crypto.randomUUID()}.${ext}`;

    // Upload to R2
    await R2.put(key, file, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const imageUrl = `${CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    // Get image dimensions (if image)
    let width: number | undefined;
    let height: number | undefined;

    if (file.type.startsWith("image/")) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        // Use ImageBitmap for getting dimensions in Cloudflare Workers
        const bitmap = await (globalThis as unknown as { createImageBitmap: (blob: Blob) => Promise<{ width: number; height: number }> }).createImageBitmap(new Blob([arrayBuffer]));
        width = bitmap.width;
        height = bitmap.height;
      } catch (e) {
        console.warn("[API] Failed to get image dimensions:", e);
      }
    }

    // Save to database
    const [image] = await db
      .insert(schema.images)
      .values({
        userId: user.id,
        originalName: file.name,
        url: imageUrl,
        type,
        size: file.size,
        mimeType: file.type,
        width,
        height,
      })
      .returning();

    return c.json({
      success: true,
      data: {
        id: image!.id,
        url: imageUrl,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        width,
        height,
      },
    });
  }
);

export default router;

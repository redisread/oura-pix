/**
 * Upload Routes
 *
 * Handle image uploads to R2
 */

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { createDb, schema } from "@oura-pix/database";
import { getUser } from "../middleware/auth";

const router = new Hono<{
  Bindings: {
    DB: D1Database;
    R2: R2Bucket;
    CLOUDFLARE_R2_PUBLIC_URL: string;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
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
    const user = getUser(c);
    if (!user) {
      return c.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "User not found" },
        },
        401
      );
    }

    const { fileName, fileType, type } = c.req.valid("json");
    const { R2, CLOUDFLARE_R2_PUBLIC_URL } = c.env;

    try {
      // Generate unique key
      const ext = fileName.split(".").pop() || "jpg";
      const key = `uploads/${user.id}/${crypto.randomUUID()}.${ext}`;

      // Create R2 upload
      const upload = await R2.createMultipartUpload(key, {
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
    } catch (error) {
      console.error("[API] Upload signed URL error:", error);
      return c.json(
        {
          success: false,
          error: { code: "UPLOAD_ERROR", message: "Failed to create upload URL" },
        },
        500
      );
    }
  }
);

// POST /api/upload/direct - Direct upload to R2
router.post(
  "/direct",
  async (c) => {
    const user = getUser(c);
    if (!user) {
      return c.json(
        {
          success: false,
          error: { code: "UNAUTHORIZED", message: "User not found" },
        },
        401
      );
    }

    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as "product" | "reference") || "product";

    if (!file) {
      return c.json(
        {
          success: false,
          error: { code: "BAD_REQUEST", message: "No file provided" },
        },
        400
      );
    }

    const { R2, CLOUDFLARE_R2_PUBLIC_URL } = c.env;

    try {
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
      const db = createDb(c.env.DB);
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
          id: image.id,
          url: imageUrl,
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          width,
          height,
        },
      });
    } catch (error) {
      console.error("[API] Upload error:", error);
      return c.json(
        {
          success: false,
          error: { code: "UPLOAD_ERROR", message: "Failed to upload file" },
        },
        500
      );
    }
  }
);

export { router as uploadRoutes };

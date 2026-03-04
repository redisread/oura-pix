"use server";

import { headers } from "next/headers";
import { getCloudflareContext } from "@/lib/cloudflare-context";
import { createDb, schema } from "@/db";
import { getCurrentUser, createAuth } from "@/lib/auth";
import { uploadArrayBuffer, R2Folders, getPublicUrl } from "@/lib/r2";
import { eq, and } from "drizzle-orm";

/**
 * 上传图片请求参数
 */
export interface UploadImageRequest {
  file: File;
  type: "product" | "reference";
}

/**
 * 上传图片响应
 */
export interface UploadImageResponse {
  success: boolean;
  data?: {
    id: string;
    url: string;
    originalName: string;
    width?: number;
    height?: number;
  };
  error?: string;
}

/**
 * 图片尺寸信息
 */
interface ImageDimensions {
  width: number;
  height: number;
}

/**
 * 获取图片尺寸
 * @param buffer 图片 Buffer
 * @returns 图片尺寸
 */
async function getImageDimensions(buffer: ArrayBuffer): Promise<ImageDimensions | null> {
  try {
    // 简单的图片尺寸解析(支持 PNG 和 JPEG)
    const bytes = new Uint8Array(buffer);
    const isPng = bytes[0] === 0x89 && bytes[1] === 0x50;
    const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8;

    if (isPng) {
      // PNG: 宽度在字节 16-19，高度在字节 20-23(大端序)
      const width =
        (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19];
      const height =
        (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23];
      return { width, height };
    }

    if (isJpeg) {
      // JPEG: 需要遍历 marker 找到 SOF0/SOF2
      let offset = 2;
      while (offset < bytes.length) {
        if (bytes[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = bytes[offset + 1];
        // SOF0, SOF1, SOF2
        if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
          const height = (bytes[offset + 5] << 8) | bytes[offset + 6];
          const width = (bytes[offset + 7] << 8) | bytes[offset + 8];
          return { width, height };
        }
        // 跳过当前 marker
        const length = (bytes[offset + 2] << 8) | bytes[offset + 3];
        offset += 2 + length;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 上传图片 Server Action
 * @param formData 包含文件的 FormData
 * @returns 上传结果
 */
export async function uploadImage(
  formData: FormData
): Promise<UploadImageResponse> {
  try {
    const { env } = await getCloudflareContext();

    // 获取当前用户 - 使用真实的请求头
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const request = new Request("http://localhost", {
      headers: { cookie },
    });

    const auth = createAuth(env.DB, env);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const file = formData.get("file") as File;
    const type = formData.get("type") as "product" | "reference";

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    // 验证文件类型
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: "Invalid file type" };
    }

    // 验证文件大小(最大 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return { success: false, error: "File too large (max 10MB)" };
    }

    // 获取图片尺寸
    const arrayBuffer = await file.arrayBuffer();
    const dimensions = await getImageDimensions(arrayBuffer);

    // 生成文件路径
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `${timestamp}-${randomString}.${extension}`;
    const key = `${R2Folders.USER_UPLOADS}/${user.id}/${filename}`;

    // 上传到 R2（使用 binding）
    await uploadArrayBuffer(arrayBuffer, file.name, {
      folder: R2Folders.USER_UPLOADS,
      contentType: file.type,
    });

    // 生成公开访问 URL
    let url: string;
    try {
      url = await getPublicUrl(key);
    } catch {
      // 如果没有配置公开 URL，使用 key 作为标识
      url = key;
    }

    // 保存到数据库
    const db = createDb(env.DB);
    const [image] = await db
      .insert(schema.images)
      .values({
        userId: user.id,
        originalName: file.name,
        url,
        type,
        size: file.size,
        mimeType: file.type,
        width: dimensions?.width,
        height: dimensions?.height,
      })
      .returning();

    return {
      success: true,
      data: {
        id: image.id,
        url: image.url,
        originalName: image.originalName,
        width: image.width || undefined,
        height: image.height || undefined,
      },
    };
  } catch (error) {
    console.error("Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * 删除图片
 * @param imageId 图片ID
 * @returns 操作结果
 */
export async function deleteImage(
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { env } = await getCloudflareContext();

    // 获取当前用户 - 使用真实的请求头
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const request = new Request("http://localhost", {
      headers: { cookie },
    });

    const auth = createAuth(env.DB, env);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    // 验证图片所有权
    const image = await db.query.images.findFirst({
      where: and(
        eq(schema.images.id, imageId),
        eq(schema.images.userId, user.id)
      ),
    });

    if (!image) {
      return { success: false, error: "Image not found" };
    }

    // 软删除
    await db
      .update(schema.images)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
      })
      .where(eq(schema.images.id, imageId));

    return { success: true };
  } catch (error) {
    console.error("Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * 获取用户图片列表
 * @param type 图片类型筛选
 * @returns 图片列表
 */
export async function getUserImages(
  type?: "product" | "reference"
): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    url: string;
    originalName: string;
    type: string;
    width?: number;
    height?: number;
    createdAt: Date;
  }>;
  error?: string;
}> {
  try {
    const { env } = await getCloudflareContext();

    // 获取当前用户 - 使用真实的请求头
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const request = new Request("http://localhost", {
      headers: { cookie },
    });

    const auth = createAuth(env.DB, env);
    const user = await getCurrentUser(auth, request);

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    const db = createDb(env.DB);

    const conditions = [
      eq(schema.images.userId, user.id),
      eq(schema.images.isDeleted, false),
    ];

    if (type) {
      conditions.push(eq(schema.images.type, type));
    }

    const images = await db.query.images.findMany({
      where: and(...conditions),
      orderBy: (images, { desc }) => [desc(images.createdAt)],
    });

    return {
      success: true,
      data: images.map((img) => ({
        id: img.id,
        url: img.url,
        originalName: img.originalName,
        type: img.type,
        width: img.width || undefined,
        height: img.height || undefined,
        createdAt: img.createdAt,
      })),
    };
  } catch (error) {
    console.error("Get images error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get images",
    };
  }
}
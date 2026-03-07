/**
 * AI 生成图片上传到 R2 存储
 * 处理 Imagen 3 生成的图片保存和数据库记录
 */

import { uploadFile, R2Folders } from '@/lib/r2';
import { createDb, schema } from '@/db';
import { getCloudflareContext } from '@/lib/cloudflare-context';
import { eq, and, inArray } from 'drizzle-orm';
import type { ImageGenResult } from '@/lib/ai/imagen';

/**
 * 上传后的图片信息
 */
export interface UploadedImageInfo {
  imageId: string;
  url: string;
  publicUrl: string;
  promptUsed: string;
  width: number;
  height: number;
  aspectRatio: string;
  variation: number;
}

/**
 * 从 Base64 转换为 ArrayBuffer
 * @param base64 Base64 编码的图片数据
 * @returns ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 从 MIME 类型获取文件扩展名
 * @param mimeType MIME 类型
 * @returns 文件扩展名
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif'
  };
  return mimeToExt[mimeType] || 'png';
}

/**
 * 计算图片宽高比
 * @param aspectRatio 宽高比字符串 (如 '1:1', '16:9')
 * @returns 格式化的宽高比
 */
function formatAspectRatio(aspectRatio?: string): string {
  return aspectRatio || '1:1';
}

/**
 * 从宽高比计算近似尺寸
 * @param aspectRatio 宽高比字符串
 * @returns { width, height }
 */
function getDimensionsFromAspectRatio(aspectRatio: string): { width: number; height: number } {
  const ratioMap: Record<string, { width: number; height: number }> = {
    '1:1': { width: 1024, height: 1024 },
    '3:4': { width: 768, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '9:16': { width: 576, height: 1024 },
    '16:9': { width: 1024, height: 576 }
  };
  return ratioMap[aspectRatio] || { width: 1024, height: 1024 };
}

/**
 * 上传 AI 生成的图片到 R2 并保存到数据库
 * @param images 生成的图片数据
 * @param generationId 关联的生成任务 ID
 * @param userId 用户 ID
 * @param aspectRatio 图片宽高比
 * @returns 上传后的图片信息列表
 */
export async function uploadGeneratedImagesToR2(
  images: ImageGenResult[],
  generationId: string,
  userId: string,
  aspectRatio: string = '1:1'
): Promise<UploadedImageInfo[]> {
  const { env } = await getCloudflareContext();
  const db = createDb(env.DB);

  const uploadedImages: UploadedImageInfo[] = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];

    try {
      // Base64 转 ArrayBuffer
      const arrayBuffer = base64ToArrayBuffer(image.base64);

      // 生成文件名
      const extension = getExtensionFromMimeType(image.mimeType);
      const fileName = `gen_${generationId}_var${i + 1}.${extension}`;

      // 上传到 R2
      const uploadResult = await uploadFile(
        arrayBuffer,
        fileName,
        {
          folder: R2Folders.GENERATED_CONTENT,
          contentType: image.mimeType,
          metadata: {
            generationId,
            userId,
            promptUsed: image.promptUsed,
            variation: String(i + 1),
            aspectRatio
          }
        }
      );

      // 计算图片尺寸
      const dimensions = getDimensionsFromAspectRatio(aspectRatio);

      // 保存到数据库 images 表
      const [dbImage] = await db
        .insert(schema.images)
        .values({
          userId,
          originalName: fileName,
          url: uploadResult.publicUrl,
          type: 'generated_scene' as const,
          size: uploadResult.size,
          mimeType: image.mimeType,
          width: dimensions.width,
          height: dimensions.height,
          generationId,
          promptUsed: image.promptUsed,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      uploadedImages.push({
        imageId: dbImage.id,
        url: uploadResult.publicUrl,
        publicUrl: uploadResult.publicUrl,
        promptUsed: image.promptUsed,
        width: dimensions.width,
        height: dimensions.height,
        aspectRatio: formatAspectRatio(aspectRatio),
        variation: i + 1
      });

    } catch (error) {
      console.error(`Failed to upload image variation ${i + 1}:`, error);
      // 继续处理其他图片,不中断整个流程
    }
  }

  return uploadedImages;
}

/**
 * 批量删除生成的图片
 * @param imageIds 图片 ID 列表
 * @param userId 用户 ID (用于权限验证)
 * @returns 删除的图片数量
 */
export async function deleteGeneratedImages(
  imageIds: string[],
  userId: string
): Promise<number> {
  const { env } = await getCloudflareContext();
  const db = createDb(env.DB);

  // 软删除:标记为已删除
  const result = await db
    .update(schema.images)
    .set({
      isDeleted: true,
      deletedAt: new Date(),
      updatedAt: new Date()
    })
    .where(
      and(
        eq(schema.images.userId, userId),
        inArray(schema.images.id, imageIds),
        eq(schema.images.type, 'generated_scene')
      )
    )
    .returning();

  return result.length;
}

/**
 * 获取生成任务关联的所有场景图
 * @param generationId 生成任务 ID
 * @param userId 用户 ID
 * @returns 图片信息列表
 */
export async function getGenerationImages(
  generationId: string,
  userId: string
): Promise<UploadedImageInfo[]> {
  const { env } = await getCloudflareContext();
  const db = createDb(env.DB);

  const images = await db.query.images.findMany({
    where: and(
      eq(schema.images.generationId, generationId),
      eq(schema.images.userId, userId),
      eq(schema.images.type, 'generated_scene'),
      eq(schema.images.isDeleted, false)
    ),
    orderBy: (images, { asc }) => [asc(images.createdAt)]
  });

  return images.map((img, index) => ({
    imageId: img.id,
    url: img.url,
    publicUrl: img.url,
    promptUsed: img.promptUsed || '',
    width: img.width || 1024,
    height: img.height || 1024,
    aspectRatio: img.width && img.height
      ? `${img.width}:${img.height}`
      : '1:1',
    variation: index + 1
  }));
}

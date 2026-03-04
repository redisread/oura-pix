/**
 * Cloudflare R2 Storage Integration
 *
 * Uses R2 binding API for file storage operations.
 * Works in both production (Cloudflare Workers) and local development (wrangler).
 */

import { getCloudflareContext, getR2 } from "./cloudflare-context";
import type { R2Bucket, R2ObjectBody } from "@cloudflare/workers-types";

/**
 * File upload options
 */
export interface UploadOptions {
  folder?: string;
  fileName?: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload result
 */
export interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
  size: number;
  contentType: string;
  etag?: string;
}

/**
 * Generate unique file key
 */
function generateFileKey(originalName: string, folder?: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `${timestamp}_${randomString}_${sanitizedName}`;
  return folder ? `${folder}/${key}` : key;
}

/**
 * Upload file to R2 storage
 *
 * @param body - File content (ArrayBuffer or string)
 * @param originalName - Original file name
 * @param options - Upload options
 * @returns Upload result with URLs
 */
export async function uploadFile(
  body: ArrayBuffer | string,
  originalName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const { env } = await getCloudflareContext();
  const bucket = env.R2 as R2Bucket;
  const r2PublicUrl = env.CLOUDFLARE_R2_PUBLIC_URL || '';
  const key = generateFileKey(originalName, options.folder);

  // Prepare upload options
  const putOptions: any = {};

  if (options.contentType) {
    putOptions.httpMetadata = {
      contentType: options.contentType,
    };
  }

  if (options.metadata) {
    putOptions.customMetadata = options.metadata;
  }

  // Upload to R2
  const result = await bucket.put(key, body, putOptions);

  if (!result) {
    throw new Error("Failed to upload file to R2");
  }

  // Generate public URL
  const publicUrl = r2PublicUrl ? `${r2PublicUrl}/${key}` : key;

  return {
    key,
    url: `r2://${key}`,
    publicUrl,
    size: result.size,
    contentType: options.contentType || "application/octet-stream",
    etag: result.etag,
  };
}

/**
 * Upload file from ArrayBuffer (convenience method)
 *
 * @param arrayBuffer - File content as ArrayBuffer
 * @param originalName - Original file name
 * @param options - Upload options
 * @returns Upload result
 */
export async function uploadArrayBuffer(
  arrayBuffer: ArrayBuffer,
  originalName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  return uploadFile(arrayBuffer, originalName, options);
}

/**
 * Upload from URL
 *
 * @param url - Source URL
 * @param options - Upload options
 * @returns Upload result
 */
export async function uploadFromUrl(
  url: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch file from URL: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "application/octet-stream";
  const arrayBuffer = await response.arrayBuffer();

  const fileName = url.split("/").pop() || "download";

  return uploadFile(arrayBuffer, fileName, {
    ...options,
    contentType,
  });
}

/**
 * Get file from R2
 *
 * @param key - File key
 * @returns R2ObjectBody or null if not found
 */
export async function getFile(key: string): Promise<R2ObjectBody | null> {
  const bucket = (await getR2()) as R2Bucket;
  return bucket.get(key);
}

/**
 * Download file as ArrayBuffer
 *
 * @param key - File key
 * @returns File content as ArrayBuffer or null if not found
 */
export async function downloadFile(key: string): Promise<ArrayBuffer | null> {
  const object = await getFile(key);
  if (!object) return null;
  return object.arrayBuffer();
}

/**
 * Delete file from R2
 *
 * @param key - File key
 */
export async function deleteFile(key: string): Promise<void> {
  const bucket = (await getR2()) as R2Bucket;
  await bucket.delete(key);
}

/**
 * Check if file exists
 *
 * @param key - File key
 * @returns True if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const bucket = (await getR2()) as R2Bucket;
  const object = await bucket.head(key);
  return object !== null;
}

/**
 * Get file metadata
 *
 * @param key - File key
 * @returns File metadata or null if not found
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  metadata: Record<string, string>;
} | null> {
  const bucket = (await getR2()) as R2Bucket;
  const object = await bucket.head(key);

  if (!object) return null;

  return {
    size: object.size,
    contentType: object.httpMetadata?.contentType || "application/octet-stream",
    lastModified: object.uploaded,
    etag: object.etag,
    metadata: object.customMetadata || {},
  };
}

/**
 * Generate public access URL
 *
 * Note: R2 binding does not support presigned URLs.
 * Use R2 public access or implement a custom solution if needed.
 *
 * @param key - File key
 * @returns Public URL
 */
export async function getPublicUrl(key: string): Promise<string> {
  const { env } = await getCloudflareContext();
  if (!env.CLOUDFLARE_R2_PUBLIC_URL) {
    throw new Error("CLOUDFLARE_R2_PUBLIC_URL is not configured");
  }
  return `${env.CLOUDFLARE_R2_PUBLIC_URL}/${key}`;
}

/**
 * List files in a folder
 *
 * @param prefix - Folder prefix
 * @param limit - Maximum number of files to return
 * @returns List of objects with keys
 */
export async function listFiles(
  prefix?: string,
  limit: number = 100
): Promise<{ objects: Array<{ key: string; size: number; uploaded: Date }>; truncated: boolean; cursor?: string }> {
  const bucket = (await getR2()) as R2Bucket;
  const result = await bucket.list({
    prefix,
    limit,
  });

  return {
    objects: result.objects.map((obj) => ({
      key: obj.key,
      size: obj.size,
      uploaded: obj.uploaded,
    })),
    truncated: result.truncated,
    cursor: "cursor" in result ? (result as any).cursor : undefined,
  };
}

/**
 * Folder constants for organizing uploads
 */
export const R2Folders = {
  PRODUCT_IMAGES: "product-images",
  GENERATED_CONTENT: "generated-content",
  USER_UPLOADS: "user-uploads",
  TEMP: "temp",
  EXPORTS: "exports",
} as const;

export type R2Folder = typeof R2Folders[keyof typeof R2Folders];
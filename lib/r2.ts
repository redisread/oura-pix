/**
 * Cloudflare R2 Storage Integration
 * Provides file upload, download, and presigned URL functionality
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

/**
 * R2 Client Configuration
 */
const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'ourapix-storage';
const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL;

/**
 * Validate environment variables
 */
function validateConfig(): void {
  if (!R2_ACCOUNT_ID) {
    throw new Error('Missing CLOUDFLARE_R2_ACCOUNT_ID environment variable');
  }
  if (!R2_ACCESS_KEY_ID) {
    throw new Error('Missing CLOUDFLARE_R2_ACCESS_KEY_ID environment variable');
  }
  if (!R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing CLOUDFLARE_R2_SECRET_ACCESS_KEY environment variable');
  }
}

/**
 * S3 Client instance for R2
 */
let r2Client: S3Client | null = null;

/**
 * Get or create R2 client instance
 */
function getR2Client(): S3Client {
  if (!r2Client) {
    validateConfig();
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return r2Client;
}

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
  const uniqueId = uuidv4().split('-')[0];
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const key = `${timestamp}_${uniqueId}_${sanitizedName}`;
  return folder ? `${folder}/${key}` : key;
}

/**
 * Upload file to R2 storage
 * @param fileBuffer - File content as Buffer
 * @param originalName - Original file name
 * @param options - Upload options
 * @returns Upload result with URLs
 */
export async function uploadFile(
  fileBuffer: Buffer,
  originalName: string,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const client = getR2Client();
  const key = generateFileKey(originalName, options.folder);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: options.contentType || 'application/octet-stream',
    Metadata: options.metadata || {},
  });

  const response = await client.send(command);

  return {
    key,
    url: `r2://${R2_BUCKET_NAME}/${key}`,
    publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`,
    size: fileBuffer.length,
    contentType: options.contentType || 'application/octet-stream',
    etag: response.ETag,
  };
}

/**
 * Upload from URL
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

  const contentType = response.headers.get('content-type') || 'application/octet-stream';
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const fileName = url.split('/').pop() || 'download';

  return uploadFile(buffer, fileName, {
    ...options,
    contentType,
  });
}

/**
 * Generate presigned URL for file access
 * @param key - File key in R2
 * @param expiresIn - URL expiration time in seconds (default: 3600)
 * @returns Presigned URL
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(client, command, { expiresIn });
}

/**
 * Generate presigned upload URL
 * @param fileName - Original file name
 * @param contentType - Content type
 * @param expiresIn - URL expiration time in seconds (default: 600)
 * @param options - Upload options
 * @returns Presigned upload URL and key
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string,
  expiresIn: number = 600,
  options: UploadOptions = {}
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const client = getR2Client();
  const key = generateFileKey(fileName, options.folder);

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Metadata: options.metadata || {},
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  return {
    uploadUrl,
    key,
    publicUrl: R2_PUBLIC_URL ? `${R2_PUBLIC_URL}/${key}` : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`,
  };
}

/**
 * Download file from R2
 * @param key - File key
 * @returns File buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await client.send(command);

  if (!response.Body) {
    throw new Error('Empty response body');
  }

  const stream = response.Body as ReadableStream;
  const chunks: Uint8Array[] = [];

  // @ts-ignore - Web Streams API
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Delete file from R2
 * @param key - File key
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getR2Client();

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await client.send(command);
}

/**
 * Check if file exists
 * @param key - File key
 * @returns True if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = getR2Client();

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await client.send(command);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

/**
 * Get file metadata
 * @param key - File key
 * @returns File metadata
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  contentType: string;
  lastModified: Date;
  etag: string;
  metadata: Record<string, string>;
}> {
  const client = getR2Client();

  const command = new HeadObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  const response = await client.send(command);

  return {
    size: response.ContentLength || 0,
    contentType: response.ContentType || 'application/octet-stream',
    lastModified: response.LastModified || new Date(),
    etag: response.ETag || '',
    metadata: response.Metadata || {},
  };
}

/**
 * Folder types for organizing uploads
 */
export const R2Folders = {
  PRODUCT_IMAGES: 'product-images',
  GENERATED_CONTENT: 'generated-content',
  USER_UPLOADS: 'user-uploads',
  TEMP: 'temp',
  EXPORTS: 'exports',
} as const;

export type R2Folder = typeof R2Folders[keyof typeof R2Folders];

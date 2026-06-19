/**
 * @oura-pix/types - Shared API and domain DTOs.
 *
 * Keep database schema definitions in @oura-pix/database so browser-facing
 * packages do not depend on Drizzle or Cloudflare database bindings.
 */

export type Platform = "amazon" | "ebay" | "shopify" | "etsy" | "generic";
export type GenerationStyle = "professional" | "lifestyle" | "minimal" | "luxury";
export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
export type GenerationStatus = "pending" | "processing" | "completed" | "failed";
export type ProcessingStage =
  | "analyzing"
  | "generating_text"
  | "generating_images"
  | "uploading"
  | "completed";
export type ImageGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

export interface GenerationSettings {
  targetPlatform?: Platform;
  language?: string;
  count?: number;
  style?: GenerationStyle;
  generateImages?: boolean;
  imageCount?: number;
  aspectRatio?: AspectRatio;
  allowPersons?: boolean;
  extra?: Record<string, unknown>;
}

export interface SceneImage {
  imageId: string;
  url: string;
  aspectRatio: string;
  width: number;
  height: number;
  promptUsed: string;
  variation: number;
}

export interface GenerationResult {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl?: string;
  confidenceScore?: number;
  sceneImages?: SceneImage[];
  metadata?: Record<string, unknown>;
}

export interface TemplateSettings {
  targetPlatform?: Platform;
  language?: string;
  style?: GenerationStyle;
  count?: number;
  aspectRatio?: AspectRatio;
  allowPersons?: boolean;
  imageCount?: number;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Generation {
  id: string;
  userId: string;
  teamId: string | null;
  status: GenerationStatus;
  productImageId: string | null;
  referenceImageIds: string[] | null;
  prompt: string | null;
  settings: GenerationSettings;
  results: GenerationResult[] | null;
  generatedImageCount: number | null;
  imageGenerationStatus: ImageGenerationStatus | null;
  imageGenerationError: string | null;
  errorMessage: string | null;
  processingStage: ProcessingStage | null;
  stageStartedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing";
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  usedGenerations: number;
  generationLimit: number;
  paymentMethodId: string | null;
  externalSubscriptionId: string | null;
  canceledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

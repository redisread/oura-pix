/**
 * Shared API types
 */

import type { GenerationSettings } from "@oura-pix/types";

// ============================================
// Generation Types
// ============================================

export interface CreateGenerationInput {
  productImageId: string;
  referenceImageIds?: string[];
  teamId?: string;
  prompt?: string;
  settings: GenerationSettings;
}

export interface GenerationsListParams {
  page?: number;
  pageSize?: number;
  filter?: "all" | "today" | "week" | "month";
  stats?: boolean;
}

// ============================================
// Upload Types
// ============================================

export interface UploadImageResponse {
  id: string;
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface GetSignedUrlInput {
  fileName: string;
  fileType: string;
  type: "product" | "reference";
}

export interface GetSignedUrlResponse {
  uploadUrl: string;
  imageUrl: string;
  imageId: string;
}

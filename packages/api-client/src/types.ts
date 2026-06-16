/**
 * Shared API types
 */

import type {
  Generation,
  GenerationSettings,
  GenerationResult,
  User,
  Subscription,
} from "@oura-pix/database";

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Auth Types
// ============================================

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

export interface Session {
  user: {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
  };
  session: {
    id: string;
    expiresAt: Date;
  };
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

// ============================================
// User Types
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  createdAt: Date;
}

export interface UpdateProfileInput {
  name?: string;
  image?: string;
}

// ============================================
// Generation Types
// ============================================

export interface CreateGenerationInput {
  productImageId: string;
  referenceImageIds?: string[];
  prompt?: string;
  settings: GenerationSettings;
}

export interface GenerationsListParams {
  page?: number;
  pageSize?: number;
  filter?: "all" | "today" | "week" | "month";
  stats?: boolean;
}

export interface GenerationsListResponse {
  generations: Generation[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface UserStats {
  totalGenerations: number;
  totalImages: number;
  thisMonthGenerations: number;
  thisMonthLimit: number;
}

// ============================================
// Upload Types
// ============================================

export interface UploadImageInput {
  image: File | Blob;
  type: "product" | "reference";
}

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

// ============================================
// Subscription Types
// ============================================

export interface SubscriptionInfo {
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "active" | "canceled" | "past_due" | "unpaid" | "trialing";
  currentPeriodEnd?: Date;
  usedGenerations: number;
  generationLimit: number;
}

export interface CheckoutInput {
  plan: "starter" | "pro" | "enterprise";
  successUrl: string;
  cancelUrl: string;
}

export interface PortalInput {
  returnUrl: string;
}

// ============================================
// Favorites Types
// ============================================

export interface AddFavoriteInput {
  generationId: string;
  imageUrl: string;
  imageIndex?: number;
}

export interface Favorite {
  id: string;
  generationId: string;
  imageUrl: string;
  imageIndex: number | null;
  createdAt: Date;
  generation: {
    id: string;
    status: string;
    settings: GenerationSettings;
    createdAt: Date;
  } | null;
}

export interface FavoritesListParams {
  page?: number;
  pageSize?: number;
}

export interface FavoritesListResponse {
  favorites: Favorite[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CheckFavoriteResponse {
  isFavorited: boolean;
  favoriteId: string | null;
}

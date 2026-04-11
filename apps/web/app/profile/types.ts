/**
 * Profile 页面类型定义
 */

// 时间筛选类型
export type TimeFilter = "all" | "today" | "week" | "month";

// 生成状态类型
export type GenerationStatus = "completed" | "processing" | "failed" | "pending";

// 生成记录类型
export interface GenerationRecord {
  id: string;
  prompt: string | null;
  platform: string;
  style: string;
  language: string;
  count: number;
  productImageId: string | null;
  productImageUrl: string | null;
  referenceImageUrls: string[];
  generatedImages: string[];
  createdAt: Date;
  status: GenerationStatus;
  errorMessage?: string | null;
}

// 分页信息
export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// 用户统计类型
export interface UserStats {
  totalGenerations: number;
  thisMonth: number;
  remainingCredits: number;
  favoriteStyle: string;
}

// Tab 类型
export type ProfileTab = "overview" | "history" | "settings";

// API 响应类型
export interface GenerationListResponse {
  data: GenerationRecord[];
  pagination: PaginationInfo;
}
/**
 * useCategories Hook
 */

import { useResource } from "@/hooks/useResource";
import * as m from "@/paraglide/messages.js";

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  bestPractices: string | null;
  sortOrder: number;
  createdAt: string;
  templateCount?: number;
}

export interface Template {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  settings: Record<string, unknown>;
  isPreset: boolean;
  createdBy: string | null;
  usageCount: number;
  createdAt: string;
}

export function useCategories() {
  const { data, loading, error, refetch } = useResource<Category[]>(
    "/api/categories",
    m.common_loadFailed()
  );
  return { categories: data ?? [], loading, error, refetch };
}

export function useCategoryTemplates(categoryId: string | null) {
  const { data, loading, error, refetch } = useResource<Template[]>(
    categoryId ? `/api/categories/${categoryId}/templates` : null,
    m.common_loadFailed()
  );
  return { templates: data ?? [], loading, error, refetch };
}

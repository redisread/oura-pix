/**
 * useCategories Hook
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<Category[]>("/api/categories");
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
  return { categories, loading, error, refetch: fetchCategories };
}

export function useCategoryTemplates(categoryId: string | null) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true); setError(null);
    try {
      const data = await apiJson<Template[]>(`/api/categories/${categoryId}/templates`);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally { setLoading(false); }
  }, [categoryId]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  return { templates, loading, error, refetch: fetchTemplates };
}

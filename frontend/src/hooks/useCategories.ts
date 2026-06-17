/**
 * useCategories Hook
 */

import { useState, useEffect, useCallback } from "react";

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

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `Request failed: ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data as T;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Category[]>("/api/categories");
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
      const data = await api<Template[]>(`/api/categories/${categoryId}/templates`);
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates");
    } finally { setLoading(false); }
  }, [categoryId]);

  useEffect(() => { fetchTemplates(); }, [fetchTemplates]);
  return { templates, loading, error, refetch: fetchTemplates };
}

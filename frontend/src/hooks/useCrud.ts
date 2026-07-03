/**
 * useCrud — 通用列表 CRUD Hook
 *
 * 将 useCollections / useCompetitors 等重复的「GET 列表 + POST 创建 +
 * PATCH/PUT 更新 + DELETE 删除 + refetch + 错误处理」模式收敛为一个泛型 hook。
 */

import { useCallback } from "react";
import { apiErr, apiJson } from "@/lib/api";
import { useResource } from "@/hooks/useResource";
import * as m from "@/paraglide/messages.js";

export interface UseCrudConfig {
  endpoint: string;
  updateMethod?: "PATCH" | "PUT";
  loadErrorMsg?: string;
}

export interface UseCrudReturn<T, CreateInput, UpdateInput> {
  items: T[];
  loading: boolean;
  error: string | null;
  setError: (msg: string | null) => void;
  refetch: () => Promise<void>;
  createItem: (input: CreateInput) => Promise<T | null>;
  updateItem: (id: string, input: UpdateInput) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
}

export function useCrud<
  T extends { id: string },
  CreateInput = Omit<T, "id" | "createdAt">,
  UpdateInput = Partial<Omit<T, "id" | "createdAt">>,
>(config: UseCrudConfig): UseCrudReturn<T, CreateInput, UpdateInput> {
  const { endpoint, updateMethod = "PATCH", loadErrorMsg = m.common_loadFailed() } = config;

  const { data, loading, error, setError, refetch } = useResource<T[]>(endpoint, loadErrorMsg);

  const items = data ?? [];

  const createItem = useCallback(
    async (input: CreateInput): Promise<T | null> => {
      try {
        const created = await apiJson<T>(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await refetch();
        return created;
      } catch (err) {
        setError(apiErr(err, m.common_createFailed()));
        return null;
      }
    },
    [endpoint, refetch, setError]
  );

  const updateItem = useCallback(
    async (id: string, input: UpdateInput): Promise<boolean> => {
      try {
        await apiJson(`${endpoint}/${id}`, {
          method: updateMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        await refetch();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_updateFailed()));
        return false;
      }
    },
    [endpoint, updateMethod, refetch, setError]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await apiJson(`${endpoint}/${id}`, { method: "DELETE" });
        await refetch();
        return true;
      } catch (err) {
        setError(apiErr(err, m.common_deleteFailed()));
        return false;
      }
    },
    [endpoint, refetch, setError]
  );

  return { items, loading, error, setError, refetch, createItem, updateItem, deleteItem };
}

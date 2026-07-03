/**
 * useCollections Hook
 */

import { useCrud } from "@/hooks/useCrud";

export interface Collection {
  id: string;
  userId: string;
  name: string;
  color: string;
  description: string | null;
  createdAt: string;
  itemCount?: number;
}

interface CollectionCreateInput {
  name: string;
  color?: string;
  description?: string;
}

interface CollectionUpdateInput {
  name?: string;
  color?: string;
  description?: string;
}

export function useCollections() {
  const { items, loading, error, refetch, createItem, updateItem, deleteItem } =
    useCrud<Collection, CollectionCreateInput, CollectionUpdateInput>({ endpoint: "/api/collections" });

  return {
    collections: items,
    loading,
    error,
    refetch,
    createCollection: createItem,
    updateCollection: updateItem,
    deleteCollection: deleteItem,
  };
}

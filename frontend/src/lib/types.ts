/**
 * Shared Frontend Types
 *
 * Common types used across multiple hooks to avoid duplication.
 */

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

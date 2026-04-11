"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  GenerationRecord,
  TimeFilter,
  GenerationStatus,
  PaginationInfo,
  UserStats,
} from "../types";

interface UseGenerationHistoryOptions {
  initialPageSize?: number;
  isAuthenticated?: boolean;
}

interface UseGenerationHistoryReturn {
  // 数据状态
  history: GenerationRecord[];
  filteredHistory: GenerationRecord[];
  paginatedHistory: GenerationRecord[];
  stats: UserStats | null;

  // 加载状态
  isLoading: boolean;
  isLoadingStats: boolean;
  error: string | null;

  // 分页状态
  currentPage: number;
  totalPages: number;
  pagination: PaginationInfo | null;

  // 筛选状态
  timeFilter: TimeFilter;
  setTimeFilter: (filter: TimeFilter) => void;

  // 操作方法
  fetchHistory: () => Promise<void>;
  fetchStats: () => Promise<void>;
  handlePageChange: (page: number) => void;
  handleDelete: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

// API 响应类型
interface GenerationListApiResponse {
  data: GenerationRecord[];
  pagination: PaginationInfo;
}

interface StatsApiResponse {
  stats: UserStats;
}

// 默认统计数据
const defaultStats: UserStats = {
  totalGenerations: 0,
  thisMonth: 0,
  remainingCredits: 10,
  favoriteStyle: "专业风格",
};

export function useGenerationHistory(
  options: UseGenerationHistoryOptions = {}
): UseGenerationHistoryReturn {
  const { initialPageSize = 10, isAuthenticated = false } = options;

  // 数据状态
  const [history, setHistory] = useState<GenerationRecord[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // 加载状态
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选和分页状态
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // 获取历史列表
  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: initialPageSize.toString(),
        filter: timeFilter,
      });

      const response = await fetch(`/api/generations?${params}`);

      if (response.status === 401) {
        // 未授权，静默处理
        setHistory([]);
        setPagination(null);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = (await response.json()) as GenerationListApiResponse;
      setHistory(data.data);
      setPagination(data.pagination);
    } catch (err) {
      console.error("Failed to fetch history:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, timeFilter, initialPageSize]);

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    setIsLoadingStats(true);

    try {
      const response = await fetch("/api/generations?stats=true");

      if (response.status === 401) {
        // 未授权，使用默认数据
        setStats(defaultStats);
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }

      const data = (await response.json()) as StatsApiResponse;
      setStats(data.stats);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setStats(defaultStats);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // 初始加载 - 只在认证后请求
  useEffect(() => {
    if (isAuthenticated) {
      fetchHistory();
    }
  }, [fetchHistory, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [fetchStats, isAuthenticated]);

  // 处理筛选变化
  const handleTimeFilterChange = useCallback((filter: TimeFilter) => {
    setTimeFilter(filter);
    setCurrentPage(1); // 重置页码
  }, []);

  // 处理分页变化
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // 删除记录
  const handleDelete = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/generations/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      // 刷新列表和统计
      await fetchHistory();
      await fetchStats();

      return true;
    } catch (err) {
      console.error("Failed to delete:", err);
      return false;
    }
  }, [fetchHistory, fetchStats]);

  // 刷新所有数据
  const refresh = useCallback(async () => {
    await Promise.all([fetchHistory(), fetchStats()]);
  }, [fetchHistory, fetchStats]);

  return {
    // 数据状态
    history,
    filteredHistory: history, // 服务端已筛选
    paginatedHistory: history, // 服务端已分页
    stats,

    // 加载状态
    isLoading,
    isLoadingStats,
    error,

    // 分页状态
    currentPage,
    totalPages: pagination?.totalPages || 1,
    pagination,

    // 筛选状态
    timeFilter,
    setTimeFilter: handleTimeFilterChange,

    // 操作方法
    fetchHistory,
    fetchStats,
    handlePageChange,
    handleDelete,
    refresh,
  };
}
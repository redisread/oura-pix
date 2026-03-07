"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getGeneration } from "@/app/actions/get-generation";
import { logger } from "@/lib/logger";

type GenerationStatus = "pending" | "processing" | "completed" | "failed";
type ImageGenerationStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

interface GenerationData {
  id: string;
  status: GenerationStatus;
  imageGenerationStatus?: ImageGenerationStatus;
  results?: unknown[];
  errorMessage?: string;
  generatedImageCount?: number;
}

interface UseGenerationPollingOptions {
  /** 轮询间隔（毫秒），默认 2000 */
  interval?: number;
  /** 最大重试次数，默认 30 次（60秒） */
  maxRetries?: number;
  /** 任务完成后是否自动停止轮询，默认 true */
  stopOnComplete?: boolean;
}

interface UseGenerationPollingReturn {
  /** 当前生成数据 */
  data: GenerationData | null;
  /** 当前状态 */
  status: GenerationStatus;
  /** 是否正在轮询 */
  isPolling: boolean;
  /** 轮询错误 */
  error: Error | null;
  /** 重试次数 */
  retryCount: number;
  /** 手动开始轮询 */
  startPolling: (generationId: string) => void;
  /** 手动停止轮询 */
  stopPolling: () => void;
}

/**
 * 智能轮询 Hook
 * 用于轮询生成任务状态，带有限制和自动清理
 *
 * @param options 轮询选项
 * @returns 轮询状态和控制器
 */
export function useGenerationPolling(
  options: UseGenerationPollingOptions = {}
): UseGenerationPollingReturn {
  const {
    interval = 2000,
    maxRetries = 30,
    stopOnComplete = true,
  } = options;

  const [data, setData] = useState<GenerationData | null>(null);
  const [status, setStatus] = useState<GenerationStatus>("pending");
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const generationIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 清理轮询定时器
   */
  const clearPollingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /**
   * 停止轮询
   */
  const stopPolling = useCallback(() => {
    clearPollingInterval();

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsPolling(false);
    logger.debug("Polling stopped", { generationId: generationIdRef.current });
  }, [clearPollingInterval]);

  /**
   * 执行单次轮询
   */
  const pollOnce = useCallback(
    async (generationId: string): Promise<boolean> => {
      try {
        // 创建新的 AbortController
        abortControllerRef.current = new AbortController();

        const result = await getGeneration(generationId);

        // 如果请求被中止，不继续处理
        if (abortControllerRef.current.signal.aborted) {
          return false;
        }

        if (result.success && result.data) {
          const generationData: GenerationData = {
            id: result.data.id,
            status: result.data.status,
            imageGenerationStatus: result.data.imageGenerationStatus,
            results: result.data.results,
            errorMessage: result.data.errorMessage,
            generatedImageCount: result.data.generatedImageCount,
          };

          setData(generationData);
          setStatus(result.data.status);
          setRetryCount(0); // 成功后重置重试计数
          setError(null);

          // 检查是否应该停止轮询
          if (stopOnComplete) {
            if (
              result.data.status === "completed" ||
              result.data.status === "failed"
            ) {
              logger.debug("Generation finished, stopping polling", {
                generationId,
                status: result.data.status,
              });
              stopPolling();
              return false;
            }
          }

          return true;
        } else {
          // API 返回错误
          const apiError = new Error(
            result.error || "Failed to get generation status"
          );
          setError(apiError);

          // 增加重试计数
          const newRetryCount = retryCount + 1;
          setRetryCount(newRetryCount);

          if (newRetryCount >= maxRetries) {
            logger.warn("Max retries reached, stopping polling", {
              generationId,
              retryCount: newRetryCount,
            });
            setError(new Error("Polling timeout - max retries reached"));
            stopPolling();
            return false;
          }

          return true;
        }
      } catch (err) {
        // 请求被中止，不视为错误
        if (err instanceof Error && err.name === "AbortError") {
          return false;
        }

        logger.error("Polling error", err);
        setError(err instanceof Error ? err : new Error(String(err)));

        // 增加重试计数
        const newRetryCount = retryCount + 1;
        setRetryCount(newRetryCount);

        if (newRetryCount >= maxRetries) {
          logger.warn("Max retries reached after error, stopping polling", {
            generationId,
            retryCount: newRetryCount,
          });
          setError(new Error("Polling timeout - max retries reached"));
          stopPolling();
          return false;
        }

        return true;
      }
    },
    [maxRetries, retryCount, stopOnComplete, stopPolling]
  );

  /**
   * 开始轮询
   */
  const startPolling = useCallback(
    (generationId: string) => {
      // 如果已经在轮询同一任务，不重复启动
      if (isPolling && generationIdRef.current === generationId) {
        return;
      }

      // 停止现有的轮询
      stopPolling();

      generationIdRef.current = generationId;
      setIsPolling(true);
      setRetryCount(0);
      setError(null);

      logger.debug("Starting polling", { generationId });

      // 立即执行一次
      pollOnce(generationId);

      // 设置轮询定时器
      intervalRef.current = setInterval(() => {
        pollOnce(generationId).then((shouldContinue) => {
          if (!shouldContinue && intervalRef.current) {
            clearPollingInterval();
          }
        });
      }, interval);
    },
    [interval, isPolling, pollOnce, stopPolling, clearPollingInterval]
  );

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      clearPollingInterval();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [clearPollingInterval]);

  // 页面可见性变化时暂停/恢复轮询
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面不可见时暂停轮询
        logger.debug("Page hidden, pausing polling");
        clearPollingInterval();
      } else if (isPolling && generationIdRef.current) {
        // 页面可见时恢复轮询
        logger.debug("Page visible, resuming polling");
        intervalRef.current = setInterval(() => {
          pollOnce(generationIdRef.current!);
        }, interval);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [interval, isPolling, pollOnce, clearPollingInterval]);

  return {
    data,
    status,
    isPolling,
    error,
    retryCount,
    startPolling,
    stopPolling,
  };
}

export default useGenerationPolling;

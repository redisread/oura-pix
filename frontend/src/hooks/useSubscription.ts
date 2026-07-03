/**
 * useSubscription Hook
 *
 * 订阅信息读取：封装 useResource，返回原始 SubscriptionInfo，
 * 不做 planLabel 等业务层转换，保持 hook 单一职责。
 */

import { useResource } from "@/hooks/useResource";
import type { SubscriptionInfo } from "@/lib/api";
import * as m from "@/paraglide/messages.js";

export interface UseSubscriptionReturn {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { data, loading, error, refetch } = useResource<SubscriptionInfo>(
    "/api/subscription",
    m.common_unknownError()
  );

  return { subscription: data, isLoading: loading, error, refresh: refetch };
}

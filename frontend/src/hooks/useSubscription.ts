/**
 * useSubscription Hook
 *
 * Fetches user subscription information from the API
 */

import { useResource } from "@/hooks/useResource";
import * as m from "@/paraglide/messages.js";

export interface SubscriptionInfo {
  plan: string;
  status: string;
  currentPeriodEnd: number | null;
  usedGenerations: number;
  generationLimit: number;
}

interface UseSubscriptionReturn {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

function planLabel(plan: string): string {
  switch (plan) {
    case "free":
      return m.pricing_free_name();
    case "starter":
      return m.pricing_pro_name();
    case "pro":
      return m.pricing_pro_name();
    case "enterprise":
      return m.pricing_enterprise_name();
    default:
      return plan;
  }
}

export function useSubscription(): UseSubscriptionReturn {
  const { data, loading, error, setError, refetch } = useResource<SubscriptionInfo>(
    "/api/subscription",
    m.common_unknownError()
  );

  const subscription = data ? { ...data, plan: planLabel(data.plan) } : null;

  return { subscription, isLoading: loading, error, refresh: refetch };
}

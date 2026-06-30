/**
 * useSubscription Hook
 *
 * Fetches user subscription information from the API
 */

import { useState, useEffect, useCallback } from "react";
import { apiJson } from "@/lib/api";
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
      return m.pricing_pro_name(); // No starter specific message, use pro as fallback
    case "pro":
      return m.pricing_pro_name();
    case "enterprise":
      return m.pricing_enterprise_name();
    default:
      return plan;
  }
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await apiJson<SubscriptionInfo>("/api/subscription");

      setSubscription({
        plan: planLabel(data.plan),
        status: data.status,
        currentPeriodEnd: data.currentPeriodEnd,
        usedGenerations: data.usedGenerations,
        generationLimit: data.generationLimit,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : m.common_unknownError());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    isLoading,
    error,
    refresh: fetchSubscription,
  };
}

/**
 * SubscriptionSettings Component (P1 #92 T4)
 *
 * Subscription management: current plan, usage progress, renewal info, upgrade CTA.
 * Data layer uses useSubscription hook, removes manual fetch/cancelled flag boilerplate.
 */

"use client";

import { useState } from "react";
import { Calendar, CreditCard, ExternalLink, Loader2, Sparkles, TrendingUp } from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { createPortalSession } from "@/lib/api";
import { useSubscription } from "@/hooks/useSubscription";
import { useToast } from "../ui/Toast";
import { SettingSection, SettingCard } from "./ui";
import { StateMessage } from "@/components/StateMessage";
import { formatShortDate } from "@/lib/locale";

type Plan = "free" | "starter" | "pro" | "enterprise";
type SubStatus = "active" | "canceled" | "past_due" | "unpaid" | "trialing" | "paused";

function planLabel(plan: string): string {
  const key = plan as Plan;
  if (key === "free") return m.subscription_plan_free();
  if (key === "starter") return m.subscription_plan_starter();
  if (key === "pro") return m.subscription_plan_pro();
  if (key === "enterprise") return m.subscription_plan_enterprise();
  return plan;
}

function statusLabel(status: string): string {
  const key = status as SubStatus;
  if (key === "active") return m.subscription_status_active();
  if (key === "canceled") return m.subscription_status_canceled();
  if (key === "past_due") return m.subscription_status_pastDue();
  if (key === "unpaid") return m.subscription_status_unpaid();
  if (key === "trialing") return m.subscription_status_trialing();
  if (key === "paused") return m.subscription_status_paused();
  return status;
}

function UsageProgress({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(total, 1)) * 100));
  const colorClass = pct < 60 ? "bg-emerald-500" : pct < 85 ? "bg-amber-500" : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="text-foreground-muted">{m.subscription_ui_monthlyUsage()}</span>
        <span className="font-semibold text-foreground">
          {used} / {total}
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--secondary))]"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ease-out ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-foreground-muted">
        {m.subscription_ui_usedPercent({ pct })}
      </div>
    </div>
  );
}

export default function SubscriptionSettings() {
  const { subscription, isLoading: loading, error } = useSubscription();
  const toast = useToast();
  const [openingPortal, setOpeningPortal] = useState(false);

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    try {
      const { url } = await createPortalSession(window.location.origin + "/settings/subscription");
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.subscription_openBillingFailed());
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return <StateMessage variant="loading" />;
  }

  if (error) {
    return <StateMessage variant="error" message={error} />;
  }

  if (!subscription) {
    return <StateMessage variant="empty" title={m.subscription_noInfo()} />;
  }

  const { plan, status, currentPeriodEnd, usedGenerations, generationLimit } = subscription;
  const isPaid = plan !== "free";
  const renewalDate = currentPeriodEnd
    ? new Date(typeof currentPeriodEnd === "number" ? currentPeriodEnd * 1000 : currentPeriodEnd)
    : null;
  const isOverLimit = usedGenerations >= generationLimit;
  const planName = planLabel(plan);
  const statusName = statusLabel(status);

  return (
    <div className="space-y-6">
      <SettingSection title={m.subscription_ui_title()} description={m.subscription_ui_subtitle()} />

      <SettingCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
              <span className="text-sm font-medium text-foreground-muted">
                {m.subscription_ui_currentPlan()}
              </span>
            </div>
            <div className="text-2xl font-bold text-foreground">{planName}</div>
            <div className="mt-1 text-xs text-foreground-muted">
              {m.subscription_ui_status()} {statusName}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {!isPaid && (
              <a
                href="/pricing"
                className="btn-primary px-4 py-2 inline-flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                {m.subscription_ui_upgrade()}
              </a>
            )}
            {isPaid && (
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={openingPortal}
                className="btn-secondary px-4 py-2 inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {openingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                {m.subscription_ui_manageBilling()}
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-[hsl(var(--border))] pt-6 space-y-4">
          <UsageProgress used={usedGenerations} total={generationLimit} />

          {renewalDate && isPaid && (
            <div className="flex items-center gap-2 text-sm text-foreground-muted pt-2 border-t border-[hsl(var(--border))]">
              <Calendar className="h-4 w-4" />
              <span>
                {m.subscription_ui_nextRenewal()}{" "}
                <span className="font-medium text-foreground">{formatShortDate(renewalDate)}</span>
              </span>
            </div>
          )}
        </div>

        {isOverLimit && (
          <div className="mt-4 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span>{m.subscription_ui_overLimit()}</span>
          </div>
        )}
      </SettingCard>

      {!isPaid && (
        <SettingCard title={m.subscription_ui_upgradeOptions()} icon={<ExternalLink className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-[hsl(var(--border))] rounded-lg p-4">
              <div className="text-xs font-medium text-foreground-muted mb-1">
                {m.subscription_plan_pro()}
              </div>
              <div className="text-lg font-bold text-foreground">¥99 / 月</div>
              <ul className="mt-2 text-xs text-foreground-muted space-y-1">
                <li>• 500 次生成 / 月</li>
                <li>• 图片生成</li>
                <li>• API 访问</li>
              </ul>
            </div>
            <div className="border border-[hsl(var(--border))] rounded-lg p-4">
              <div className="text-xs font-medium text-foreground-muted mb-1">
                {m.subscription_plan_enterprise()}
              </div>
              <div className="text-lg font-bold text-foreground">¥499 / 月</div>
              <ul className="mt-2 text-xs text-foreground-muted space-y-1">
                <li>• 不限次数生成</li>
                <li>• 团队协作</li>
                <li>• 优先支持</li>
              </ul>
            </div>
          </div>
          <a href="/pricing" className="btn-primary w-full mt-4 py-2 inline-flex items-center justify-center">
            {m.subscription_ui_viewPlans()}
          </a>
        </SettingCard>
      )}
    </div>
  );
}

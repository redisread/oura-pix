/**
 * SubscriptionSettings Component (P1 #92 T4)
 *
 * Subscription management: current plan, usage progress, renewal info, upgrade CTA.
 */

"use client";

import { useEffect, useState } from "react";
import { Calendar, CreditCard, ExternalLink, Loader2, Sparkles, TrendingUp } from "lucide-react";
import { getSubscription, createPortalSession, type SubscriptionInfo } from "@/lib/api";
import { useToast } from "../ui/Toast";
import { SettingSection, SettingCard } from "./ui";

type SubscriptionData = SubscriptionInfo;

const PLAN_LABEL: Record<string, string> = {
  free: "免费版",
  pro: "专业版",
  enterprise: "企业版",
};

const STATUS_LABEL: Record<string, string> = {
  active: "活跃",
  canceled: "已取消",
  past_due: "逾期",
  paused: "已暂停",
};

function UsageProgress({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, Math.round((used / Math.max(total, 1)) * 100));
  const colorClass = pct < 60 ? "bg-emerald-500" : pct < 85 ? "bg-amber-500" : "bg-red-500";

  return (
    <div>
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="text-foreground-muted">本月用量</span>
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
      <div className="mt-1 text-xs text-foreground-muted">{pct}% 已使用</div>
    </div>
  );
}

export default function SubscriptionSettings() {
  const toast = useToast();
  const [sub, setSub] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        if (!cancelled) {
          setSub(await getSubscription());
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "加载订阅信息失败");
          setSub({
            plan: "free",
            status: "active",
            usedGenerations: 0,
            generationLimit: 10,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManageBilling = async () => {
    setOpeningPortal(true);
    try {
      const { url } = await createPortalSession(window.location.origin + "/settings/subscription");
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "打开账单管理失败");
    } finally {
      setOpeningPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center text-foreground-muted">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        加载中...
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="card p-8 text-center text-foreground-muted">暂无订阅信息</div>
    );
  }

  const isPaid = sub.plan !== "free";
  const renewalDate = sub.currentPeriodEnd ? new Date(typeof sub.currentPeriodEnd === "number" ? sub.currentPeriodEnd * 1000 : sub.currentPeriodEnd) : null;
  const isOverLimit = sub.usedGenerations >= sub.generationLimit;

  return (
    <div className="space-y-6">
      <SettingSection title="订阅管理" description="查看你的当前计划、用量和账单" />

      {/* Current Plan Card */}
      <SettingCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
              <span className="text-sm font-medium text-foreground-muted">当前计划</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{PLAN_LABEL[sub.plan] ?? sub.plan}</div>
            <div className="mt-1 text-xs text-foreground-muted">
              状态：{STATUS_LABEL[sub.status] ?? sub.status}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {!isPaid && (
              <a
                href="/pricing"
                className="btn-primary px-4 py-2 inline-flex items-center justify-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                升级到专业版
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
                管理账单
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-[hsl(var(--border))] pt-6 space-y-4">
          <UsageProgress used={sub.usedGenerations} total={sub.generationLimit} />

          {renewalDate && isPaid && (
            <div className="flex items-center gap-2 text-sm text-foreground-muted pt-2 border-t border-[hsl(var(--border))]">
              <Calendar className="h-4 w-4" />
              <span>
                下次续费日期：<span className="font-medium text-foreground">{renewalDate.toLocaleDateString("zh-CN")}</span>
              </span>
            </div>
          )}
        </div>

        {isOverLimit && (
          <div className="mt-4 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 text-sm flex items-start gap-2">
            <span>⚠️</span>
            <span>本月额度已用完。升级到专业版获取更多生成次数。</span>
          </div>
        )}
      </SettingCard>

      {/* Plan Comparison Hint */}
      {!isPaid && (
        <SettingCard title="升级方案" icon={<ExternalLink className="h-4 w-4" />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-[hsl(var(--border))] rounded-lg p-4">
              <div className="text-xs font-medium text-foreground-muted mb-1">专业版</div>
              <div className="text-lg font-bold text-foreground">¥99 / 月</div>
              <ul className="mt-2 text-xs text-foreground-muted space-y-1">
                <li>• 500 次生成 / 月</li>
                <li>• 图片生成</li>
                <li>• API 访问</li>
              </ul>
            </div>
            <div className="border border-[hsl(var(--border))] rounded-lg p-4">
              <div className="text-xs font-medium text-foreground-muted mb-1">企业版</div>
              <div className="text-lg font-bold text-foreground">¥499 / 月</div>
              <ul className="mt-2 text-xs text-foreground-muted space-y-1">
                <li>• 不限次数生成</li>
                <li>• 团队协作</li>
                <li>• 优先支持</li>
              </ul>
            </div>
          </div>
          <a href="/pricing" className="btn-primary w-full mt-4 py-2 inline-flex items-center justify-center">
            查看完整方案对比
          </a>
        </SettingCard>
      )}
    </div>
  );
}

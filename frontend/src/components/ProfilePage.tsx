"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Coins,
  Eye,
  FolderOpen,
  ImageIcon,
  Loader2,
  Palette,
  Save,
  ShieldCheck,
  Trash2,
  User,
  Zap,
} from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useAuth } from "@/hooks/use-auth";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useGenerations } from "@/hooks/useGenerations";
import { WorkbenchPageLayout } from "@/components/layout/WorkbenchPageLayout";
import { PageHeader } from "@/components/layout/PageHeader";

type ProfileTab = "overview" | "history" | "settings";

function statusClass(status: string) {
  if (status === "completed" || status === "success") return "status-badge-success";
  if (status === "processing" || status === "pending") return "status-badge-info";
  return "status-badge-error";
}

function statusLabel(status: string) {
  if (status === "completed" || status === "success") return m.profile_history_status_completed();
  if (status === "processing" || status === "pending") return m.profile_history_status_processing();
  return m.profile_history_status_failed();
}

function StatsCards() {
  const { stats, isLoading } = useProfileStats();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="panel p-5 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-md bg-[hsl(var(--secondary))]" />
              <div className="space-y-2">
                <div className="h-4 w-20 rounded bg-[hsl(var(--secondary))]" />
                <div className="h-6 w-10 rounded bg-[hsl(var(--secondary))]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const statsData = [
    {
      label: m.profile_stats_totalGenerations(),
      value: stats?.totalGenerations ?? 0,
      icon: ImageIcon,
      tone: "text-[hsl(var(--primary))] bg-[hsl(var(--color-info-light))]",
    },
    {
      label: m.profile_stats_thisMonth(),
      value: stats?.thisMonth ?? 0,
      icon: CalendarDays,
      tone: "text-[hsl(var(--color-success))] bg-[hsl(var(--color-success-light))]",
    },
    {
      label: m.profile_stats_remainingCredits(),
      value: stats?.remainingCredits ?? 0,
      icon: Coins,
      tone: "text-[hsl(var(--accent))] bg-[hsl(var(--color-warning-light))]",
    },
    {
      label: m.profile_stats_favoriteStyle(),
      value: stats?.favoriteStyle ?? "-",
      icon: Palette,
      tone: "text-foreground bg-[hsl(var(--secondary))]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsData.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.label} className="panel p-5">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md ${item.tone}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground-muted">{item.label}</p>
                <p className="truncate text-2xl font-semibold text-foreground">{item.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function UserInfoCard() {
  const { user } = useAuth();
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "-";

  const rows = [
    [m.profile_userInfo_username(), user?.name || "User"],
    [m.profile_userInfo_email(), user?.email || "user@example.com"],
    [m.profile_userInfo_memberSince(), memberSince],
    [m.profile_userInfo_plan(), m.profile_userInfo_proPlan()],
  ];

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[hsl(var(--border))] p-5">
        <h2 className="panel-title">{m.profile_userInfo_title()}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label} className="panel-muted p-4">
            <p className="panel-label">{label}</p>
            <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GenerationHistory() {
  const { generations, isLoading, error, refresh } = useGenerations({ initialPageSize: 20 });

  const handleDelete = async (id: string) => {
    try {
      await import("@/lib/api").then(({ deleteGeneration }) => deleteGeneration(id));
      refresh();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (isLoading) {
    return (
      <section className="panel overflow-hidden">
        <div className="border-b border-[hsl(var(--border))] p-5">
          <h2 className="panel-title">{m.profile_history_title()}</h2>
          <p className="mt-1 text-sm text-foreground-muted">{m.profile_history_subtitle()}</p>
        </div>
        <div className="space-y-4 p-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="h-16 w-16 rounded bg-[hsl(var(--secondary))]" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-[hsl(var(--secondary))]" />
                <div className="h-3 w-1/2 rounded bg-[hsl(var(--secondary))]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel overflow-hidden">
        <div className="border-b border-[hsl(var(--border))] p-5">
          <h2 className="panel-title">{m.profile_history_title()}</h2>
        </div>
        <div className="error-banner m-5">
          <p>{error}</p>
          <button onClick={refresh} className="mt-2 text-sm font-semibold underline">{m.common_retry()}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[hsl(var(--border))] p-5">
        <h2 className="panel-title">{m.profile_history_title()}</h2>
        <p className="mt-1 text-sm text-foreground-muted">{m.profile_history_subtitle()}</p>
      </div>

      {generations.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <FolderOpen className="mb-4 h-12 w-12 text-foreground-muted" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-foreground">{m.profile_history_empty()}</h3>
          <p className="mt-2 text-sm text-foreground-muted">{m.profile_history_emptyDesc()}</p>
          <a href={localizeHref("/generate")} className="btn-primary mt-5 h-10 px-4">
            {m.profile_history_startGenerating()}
          </a>
        </div>
      ) : (
        <div>
          {generations.map((item) => (
            <div key={item.id} className="data-row p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {item.prompt || m.profile_history_noPrompt()}
                    </h3>
                    <span className={`status-badge ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {item.platform} · {item.style} · {item.language}
                  </p>
                  <p className="font-utility mt-1 text-xs text-foreground-muted">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.location.href = localizeHref(`/generate?history=${item.id}`)}
                    className="btn-secondary h-9 gap-2 px-3"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                    {m.profile_history_viewDetail()}
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn-secondary h-9 gap-2 px-3 text-[hsl(var(--color-error))]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {m.profile_history_delete()}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[hsl(var(--border))] p-5">
        <h2 className="panel-title">{m.profile_settings_title()}</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 p-5">
        <section>
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-[hsl(var(--primary))]" aria-hidden="true" />
            {m.profile_settings_profile()}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="panel-label mb-1 block">{m.profile_userInfo_username()}</label>
              <input type="text" defaultValue={user?.name || ""} className="input" />
            </div>
            <div>
              <label className="panel-label mb-1 block">{m.profile_userInfo_email()}</label>
              <input type="email" defaultValue={user?.email || ""} className="input" />
            </div>
          </div>
        </section>

        <section className="border-t border-[hsl(var(--border))] pt-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldCheck className="h-4 w-4 text-[hsl(var(--primary))]" aria-hidden="true" />
            {m.profile_settings_password()}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="panel-label mb-1 block">{m.profile_settings_currentPassword()}</label>
              <input
                type="password"
                placeholder={m.profile_settings_enterCurrentPassword()}
                className="input"
              />
            </div>
            <div>
              <label className="panel-label mb-1 block">{m.profile_settings_newPassword()}</label>
              <input
                type="password"
                placeholder={m.profile_settings_enterNewPassword()}
                className="input"
              />
            </div>
          </div>
        </section>

        <section className="border-t border-[hsl(var(--border))] pt-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bell className="h-4 w-4 text-[hsl(var(--primary))]" aria-hidden="true" />
            {m.profile_settings_notifications()}
          </h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                id="notify-generation"
                defaultChecked
                className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.28)]"
              />
              {m.profile_settings_notifyOnComplete()}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                id="notify-marketing"
                className="h-4 w-4 rounded border-[hsl(var(--border))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary)/0.28)]"
              />
              {m.profile_settings_receiveMarketing()}
            </label>
          </div>
        </section>

        <div className="border-t border-[hsl(var(--border))] pt-6">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary h-10 gap-2 px-6 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" aria-hidden="true" />
            {isLoading ? m.profile_settings_saving() : m.profile_settings_save()}
          </button>
        </div>
      </form>
    </section>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const { user, isLoading: isAuthLoading } = useAuth();
  const { generations } = useGenerations({ initialPageSize: 3 });

  if (isAuthLoading) {
    return (
      <WorkbenchPageLayout>
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-2 text-foreground-muted">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            {m.profile_loading()}
          </div>
        </div>
      </WorkbenchPageLayout>
    );
  }

  const tabs = [
    { id: "overview" as ProfileTab, label: m.profile_tabs_overview() },
    { id: "history" as ProfileTab, label: m.profile_tabs_history() },
    { id: "settings" as ProfileTab, label: m.profile_tabs_settings() },
  ];

  return (
    <WorkbenchPageLayout>
      <PageHeader
        kicker={m.profile_kicker()}
        title={m.profile_title()}
        description={m.profile_subtitle()}
        actions={
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
            <span className="text-2xl font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        }
      />

      <div className="panel mb-6 flex flex-wrap gap-1 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`segmented-option ${activeTab === tab.id ? "segmented-option-active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="space-y-6">
          <StatsCards />
          <UserInfoCard />
          <section className="panel overflow-hidden">
            <div className="border-b border-[hsl(var(--border))] p-5">
              <h2 className="panel-title">{m.profile_overview_recentActivity()}</h2>
            </div>
            <div>
              {generations.slice(0, 3).map((item) => (
                <div key={item.id} className="data-row flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--color-info-light))] text-[hsl(var(--primary))]">
                    <Zap className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.prompt || m.profile_history_noPrompt()}
                    </p>
                    <p className="font-utility text-xs text-foreground-muted">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="status-badge status-badge-neutral">{item.platform}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {activeTab === "history" && <GenerationHistory />}
      {activeTab === "settings" && <SettingsForm />}
    </WorkbenchPageLayout>
  );
}

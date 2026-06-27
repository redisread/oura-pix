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

type ProfileTab = "overview" | "history" | "settings";

interface GenerationRecord {
  id: string;
  prompt: string;
  platform: string;
  style: string;
  language: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
}

const mockHistory: GenerationRecord[] = [
  {
    id: "1",
    prompt: "高端无线蓝牙耳机",
    platform: "Amazon",
    style: "简约现代",
    language: "中文",
    createdAt: "2024-01-15 10:30",
    status: "completed",
  },
  {
    id: "2",
    prompt: "智能手表",
    platform: "Temu",
    style: "科技感",
    language: "英文",
    createdAt: "2024-01-14 15:20",
    status: "completed",
  },
];

function statusClass(status: GenerationRecord["status"]) {
  if (status === "completed") return "status-badge-success";
  if (status === "processing") return "status-badge-info";
  return "status-badge-error";
}

function statusLabel(status: GenerationRecord["status"]) {
  if (status === "completed") return m.profile_history_status_completed();
  if (status === "processing") return m.profile_history_status_processing();
  return m.profile_history_status_failed();
}

function StatsCards() {
  const stats = [
    {
      label: m.profile_stats_totalGenerations(),
      value: 12,
      icon: ImageIcon,
      tone: "text-[hsl(var(--primary))] bg-[hsl(var(--color-info-light))]",
    },
    {
      label: m.profile_stats_thisMonth(),
      value: 5,
      icon: CalendarDays,
      tone: "text-[hsl(var(--color-success))] bg-[hsl(var(--color-success-light))]",
    },
    {
      label: m.profile_stats_remainingCredits(),
      value: 195,
      icon: Coins,
      tone: "text-[hsl(var(--accent))] bg-[hsl(var(--color-warning-light))]",
    },
    {
      label: m.profile_stats_favoriteStyle(),
      value: "简约现代",
      icon: Palette,
      tone: "text-foreground bg-[hsl(var(--secondary))]",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((item) => {
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
  const rows = [
    [m.profile_userInfo_username(), user?.name || "User"],
    [m.profile_userInfo_email(), user?.email || "user@example.com"],
    [m.profile_userInfo_memberSince(), "2024-01-01"],
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
  const handleDelete = (_id: string) => {
    // TODO: Implement delete functionality
  };

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-[hsl(var(--border))] p-5">
        <h2 className="panel-title">{m.profile_history_title()}</h2>
        <p className="mt-1 text-sm text-foreground-muted">{m.profile_history_subtitle()}</p>
      </div>

      {mockHistory.length === 0 ? (
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
          {mockHistory.map((item) => (
            <div key={item.id} className="data-row p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{item.prompt}</h3>
                    <span className={`status-badge ${statusClass(item.status)}`}>
                      {statusLabel(item.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">
                    {item.platform} · {item.style} · {item.language}
                  </p>
                  <p className="font-utility mt-1 text-xs text-foreground-muted">{item.createdAt}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-secondary h-9 gap-2 px-3">
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

  if (isAuthLoading) {
    return (
      <div className="workbench-page flex items-center justify-center">
        <div className="flex items-center gap-2 text-foreground-muted">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          {m.profile_loading()}
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as ProfileTab, label: m.profile_tabs_overview() },
    { id: "history" as ProfileTab, label: m.profile_tabs_history() },
    { id: "settings" as ProfileTab, label: m.profile_tabs_settings() },
  ];

  return (
    <div className="workbench-page">
      <div className="workbench-container">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="page-kicker">Account / Seller bench</p>
            <h1 className="page-title mt-2">{m.profile_title()}</h1>
            <p className="page-description mt-2">{m.profile_subtitle()}</p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
            <span className="text-2xl font-semibold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          </div>
        </header>

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
                {mockHistory.slice(0, 3).map((item) => (
                  <div key={item.id} className="data-row flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[hsl(var(--color-info-light))] text-[hsl(var(--primary))]">
                      <Zap className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{item.prompt}</p>
                      <p className="font-utility text-xs text-foreground-muted">{item.createdAt}</p>
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
      </div>
    </div>
  );
}

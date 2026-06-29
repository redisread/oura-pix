/**
 * PreferencesSettings Component (P2 #95 T7)
 *
 * Theme / language / notification preferences.
 */

"use client";

import { useEffect, useState } from "react";
import { Bell, Globe, Moon, Save, Sun } from "lucide-react";
import { setLocale, getLocale, type Locale } from "@/paraglide/runtime.js";
import { api } from "@/lib/api";
import { useToast } from "../ui/Toast";

type ThemeMode = "light" | "dark" | "auto";

const THEME_KEY = "oura-pix:theme";
const NOTIF_KEY = "oura-pix:notifications";

interface NotificationPrefs {
  emailProduct: boolean;
  emailBilling: boolean;
  inappProduct: boolean;
}

const DEFAULT_NOTIF: NotificationPrefs = {
  emailProduct: true,
  emailBilling: true,
  inappProduct: true,
};

const LANGUAGES: { tag: Locale; label: string; flag: string }[] = [
  { tag: "zh-CN", label: "简体中文", flag: "🇨🇳" },
  { tag: "en", label: "English", flag: "🇺🇸" },
  { tag: "ja", label: "日本語", flag: "🇯🇵" },
];

function applyTheme(mode: ThemeMode) {
  if (typeof window === "undefined") return;
  const isDark =
    mode === "dark" ||
    (mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

export default function PreferencesSettings() {
  const toast = useToast();
  const [theme, setTheme] = useState<ThemeMode>("auto");
  const [language, setLanguage] = useState<Locale>(() => {
    try {
      return getLocale() as Locale;
    } catch {
      return "zh-CN";
    }
  });
  const [notif, setNotif] = useState<NotificationPrefs>(DEFAULT_NOTIF);
  const [savingNotif, setSavingNotif] = useState(false);
  const [notifDirty, setNotifDirty] = useState(false);

  useEffect(() => {
    // Load theme from localStorage
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY)) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "auto") {
      setTheme(stored);
    }
    applyTheme(stored ?? "auto");

    // Load notification prefs from localStorage
    try {
      const stored = localStorage.getItem(NOTIF_KEY);
      if (stored) setNotif(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  // React to theme changes
  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // React to system theme changes when in auto mode
  useEffect(() => {
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const handleLanguageChange = (lang: Locale) => {
    setLanguage(lang);
    try {
      setLocale(lang);
      toast.success("语言已切换");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "语言切换失败");
    }
  };

  const handleNotifChange = (key: keyof NotificationPrefs, value: boolean) => {
    setNotif((prev) => ({ ...prev, [key]: value }));
    setNotifDirty(true);
  };

  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try {
      // Persist locally
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notif));
      // Sync to backend if user is logged in (best-effort)
      try {
        await api.patch("/api/users/me/preferences", { notifications: notif });
      } catch {
        // backend endpoint may not exist; silently keep local
      }
      setNotifDirty(false);
      toast.success("通知偏好已保存");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSavingNotif(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">偏好设置</h2>
        <p className="mt-1 text-sm text-foreground-muted">个性化你的体验</p>
      </div>

      {/* Theme */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Sun className="h-4 w-4" /> 主题
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {([
            { mode: "light" as const, label: "浅色", icon: Sun },
            { mode: "dark" as const, label: "深色", icon: Moon },
            { mode: "auto" as const, label: "自动", icon: Globe },
          ]).map(({ mode, label, icon: Icon }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTheme(mode)}
              aria-pressed={theme === mode}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors
                ${theme === mode
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--foreground)/0.3)]"
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-foreground-muted">
          自动模式会跟随系统主题变化
        </p>
      </div>

      {/* Language */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Globe className="h-4 w-4" /> 语言
        </h3>
        <div className="space-y-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.tag}
              type="button"
              onClick={() => handleLanguageChange(lang.tag)}
              aria-pressed={language === lang.tag}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left
                ${language === lang.tag
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.05)]"
                  : "border-[hsl(var(--border))] hover:border-[hsl(var(--foreground)/0.3)]"
                }
              `}
            >
              <span className="text-xl">{lang.flag}</span>
              <span className="text-sm font-medium flex-1">{lang.label}</span>
              {language === lang.tag && (
                <span className="text-xs font-semibold text-[hsl(var(--primary))]">✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-4 w-4" /> 通知偏好
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notif.emailProduct}
              onChange={(e) => handleNotifChange("emailProduct", e.target.checked)}
              className="rounded"
            />
            <span>邮件通知 - 产品更新和新功能</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notif.emailBilling}
              onChange={(e) => handleNotifChange("emailBilling", e.target.checked)}
              className="rounded"
            />
            <span>邮件通知 - 账单和订阅</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notif.inappProduct}
              onChange={(e) => handleNotifChange("inappProduct", e.target.checked)}
              className="rounded"
            />
            <span>站内信 - 生成完成和团队活动</span>
          </label>
        </div>
        <div className="flex justify-end border-t border-[hsl(var(--border))] pt-4">
          <button
            type="button"
            onClick={handleSaveNotif}
            disabled={!notifDirty || savingNotif}
            className="btn-primary px-4 py-2 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
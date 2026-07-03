/**
 * PreferencesSettings Component (P2 #95 T7)
 *
 * Theme / language / notification preferences.
 */

"use client";

import * as m from "@/paraglide/messages.js";
import { useEffect, useState } from "react";
import { Bell, Globe, Moon, Save, Sun } from "lucide-react";
import { setLocale, getLocale, type Locale } from "@/paraglide/runtime.js";
import { api } from "@/lib/api";
import { useToast } from "../ui/Toast";
import { SettingSection, SettingCard, SettingActions } from "./ui";

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
    const stored = (typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY)) as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "auto") {
      setTheme(stored);
    }
    applyTheme(stored ?? "auto");

    try {
      const stored = localStorage.getItem(NOTIF_KEY);
      if (stored) setNotif(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

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
      toast.success(m.preferences_toast_languageSwitched());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.preferences_toast_languageFailed());
    }
  };

  const handleNotifChange = (key: keyof NotificationPrefs, value: boolean) => {
    setNotif((prev) => ({ ...prev, [key]: value }));
    setNotifDirty(true);
  };

  const handleSaveNotif = async () => {
    setSavingNotif(true);
    try {
      localStorage.setItem(NOTIF_KEY, JSON.stringify(notif));
      try {
        await api.patch("/api/users/me/preferences", { notifications: notif });
      } catch {
        // backend endpoint may not exist; silently keep local
      }
      setNotifDirty(false);
      toast.success(m.preferences_toast_notifSaved());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : m.preferences_toast_notifSaveFailed());
    } finally {
      setSavingNotif(false);
    }
  };

  return (
    <div className="space-y-6">
      <SettingSection title={m.preferences_title()} description={m.preferences_description()} />

      {/* Theme */}
      <SettingCard title={m.preferences_theme_title()} icon={<Sun className="h-4 w-4" />}>
        <div className="grid grid-cols-3 gap-3">
          {([
            { mode: "light" as const, label: m.preferences_theme_light(), icon: Sun },
            { mode: "dark" as const, label: m.preferences_theme_dark(), icon: Moon },
            { mode: "auto" as const, label: m.preferences_theme_auto(), icon: Globe },
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
          {m.preferences_theme_autoHint()}
        </p>
      </SettingCard>

      {/* Language */}
      <SettingCard title={m.preferences_language_title()} icon={<Globe className="h-4 w-4" />}>
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
      </SettingCard>

      {/* Notifications */}
      <SettingCard title={m.preferences_notifications_title()} icon={<Bell className="h-4 w-4" />}>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notif.emailProduct}
              onChange={(e) => handleNotifChange("emailProduct", e.target.checked)}
              className="rounded"
            />
            <span>{m.preferences_notifications_emailProduct()}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notif.emailBilling}
              onChange={(e) => handleNotifChange("emailBilling", e.target.checked)}
              className="rounded"
            />
            <span>{m.preferences_notifications_emailBilling()}</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={notif.inappProduct}
              onChange={(e) => handleNotifChange("inappProduct", e.target.checked)}
              className="rounded"
            />
            <span>{m.preferences_notifications_inappProduct()}</span>
          </label>
        </div>
        <SettingActions>
          <button
            type="button"
            onClick={handleSaveNotif}
            disabled={!notifDirty || savingNotif}
            className="btn-primary px-4 py-2 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4" />
            {m.common_save()}
          </button>
        </SettingActions>
      </SettingCard>
    </div>
  );
}

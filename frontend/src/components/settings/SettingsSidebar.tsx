/**
 * SettingsSidebar Component (P0 #89)
 *
 * Desktop sidebar navigation for /settings/* pages
 */

"use client";

import { User, CreditCard, Key, Users, Settings } from "lucide-react";

export interface SettingsNavItem {
  href: string;
  icon: typeof User;
  label: string;
  key: string;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { href: "/settings/account", icon: User, label: "账号", key: "account" },
  { href: "/settings/subscription", icon: CreditCard, label: "订阅", key: "subscription" },
  { href: "/settings/api-keys", icon: Key, label: "API Keys", key: "api-keys" },
  { href: "/settings/teams", icon: Users, label: "团队", key: "teams" },
  { href: "/settings/preferences", icon: Settings, label: "偏好", key: "preferences" },
];

interface SettingsSidebarProps {
  currentKey?: string;
}

export default function SettingsSidebar({ currentKey }: SettingsSidebarProps) {
  return (
    <nav aria-label="设置导航" className="space-y-1">
      <div className="px-3 py-2 mb-2">
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          个人中心
        </h2>
      </div>
      {SETTINGS_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentKey === item.key;
        return (
          <a
            key={item.key}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`
              flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${isActive
                ? "bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]"
                : "text-foreground hover:bg-[hsl(var(--secondary))]"
              }
            `}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </a>
        );
      })}
    </nav>
  );
}
/**
 * SettingsSidebar Component (P0 #89)
 *
 * Desktop sidebar navigation for /settings/* pages
 */

"use client";

import { User, CreditCard, Key, Users, Settings } from "lucide-react";
import * as m from "@/paraglide/messages.js";

export interface SettingsNavItem {
  href: string;
  icon: typeof User;
  key: string;
}

export const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  { href: "/settings/account", icon: User, key: "account" },
  { href: "/settings/subscription", icon: CreditCard, key: "subscription" },
  { href: "/settings/api-keys", icon: Key, key: "api-keys" },
  { href: "/settings/teams", icon: Users, key: "teams" },
  { href: "/settings/preferences", icon: Settings, key: "preferences" },
];

export function getSettingsNavLabel(key: string): string {
  switch (key) {
    case "account":
      return m.nav_account();
    case "subscription":
      return m.nav_subscription();
    case "api-keys":
      return m.nav_apiKeys();
    case "teams":
      return m.nav_teams();
    case "preferences":
      return m.nav_preferences();
    default:
      return key;
  }
}

interface SettingsSidebarProps {
  currentKey?: string;
}

export default function SettingsSidebar({ currentKey }: SettingsSidebarProps) {
  return (
    <nav aria-label={m.settings_centerTitle()} className="space-y-1">
      <div className="px-3 py-2 mb-2">
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wide">
          {m.settings_centerTitle()}
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
            <span>{getSettingsNavLabel(item.key)}</span>
          </a>
        );
      })}
    </nav>
  );
}
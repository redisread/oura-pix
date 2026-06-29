/**
 * MobileSettingsTabs Component (P0 #90 T2)
 *
 * Horizontal scrollable tab bar for /settings/* on mobile (< lg).
 * Active tab auto-scrolls into view on mount and on change.
 */

"use client";

import { useEffect, useRef } from "react";
import { SETTINGS_NAV_ITEMS, type SettingsNavItem } from "./SettingsSidebar";

interface MobileSettingsTabsProps {
  currentKey?: string;
}

export default function MobileSettingsTabs({ currentKey }: MobileSettingsTabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (activeRef.current && containerRef.current) {
      const container = containerRef.current;
      const active = activeRef.current;
      const scrollLeft = active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [currentKey]);

  return (
    <nav
      ref={containerRef}
      aria-label="设置导航（移动端）"
      className="lg:hidden overflow-x-auto border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] -mx-4 px-4 sm:-mx-6 sm:px-6"
      style={{ scrollbarWidth: "none" }}
    >
      <div className="flex gap-1 min-w-max py-2">
        {SETTINGS_NAV_ITEMS.map((item: SettingsNavItem) => {
          const isActive = item.key === currentKey;
          return (
            <a
              key={item.key}
              ref={isActive ? activeRef : undefined}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`
                shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative
                ${isActive
                  ? "text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]"
                  : "text-foreground-muted hover:text-foreground hover:bg-[hsl(var(--secondary))]"
                }
              `}
            >
              {item.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[hsl(var(--primary))]"
                  aria-hidden="true"
                />
              )}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
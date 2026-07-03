/**
 * ShortcutsDemo Tool
 *
 * Demo page showing available keyboard shortcuts.
 * Hooks (useKeyboardShortcuts) are also integrated into ImageEditor and other tools.
 */

"use client";

import { useState } from "react";
import { Keyboard, Zap } from "lucide-react";
import { useKeyboardShortcuts, ShortcutBadge } from "@/hooks/useKeyboardShortcuts";
import * as m from "@/paraglide/messages.js";
import { ToolPageLayout } from "./ToolPageLayout";

type ShortcutCategory = "edit" | "file" | "navigation";

const SHORTCUTS = [
  { keys: "Ctrl + Z", label: m.tool_shortcutUndo, category: "edit" },
  { keys: "Ctrl + Shift + Z", label: m.tool_shortcutRedo, category: "edit" },
  { keys: "Ctrl + S", label: m.tool_shortcutSave, category: "file" },
  { keys: "Ctrl + D", label: m.tool_shortcutDownload, category: "file" },
  { keys: "Esc", label: m.tool_shortcutClose, category: "navigation" },
  { keys: "1 - 9", label: m.tool_shortcutTab, category: "navigation" },
];

const CATEGORIES: Array<{ value: ShortcutCategory; label: () => string }> = [
  { value: "edit", label: m.tool_shortcutCategoryEdit },
  { value: "file", label: m.tool_shortcutCategoryFile },
  { value: "navigation", label: m.tool_shortcutCategoryNavigation },
];

export default function ShortcutsDemo() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  useKeyboardShortcuts({
    onUndo: () => setLastAction(m.tool_actionUndo()),
    onRedo: () => setLastAction(m.tool_actionRedo()),
    onSave: () => setLastAction(m.tool_actionSave()),
    onDownload: () => setLastAction(m.tool_actionDownload()),
    onClose: () => setLastAction(m.tool_actionClose()),
    onTabSelect: (idx) => setLastAction(m.tool_actionTab({ tab: (idx + 1).toString(), key: (idx + 1).toString() })),
  });

  return (
    <ToolPageLayout
      kicker={m.tool_shortcutsKicker()}
      title={m.tool_shortcutsTitle()}
      subtitle={m.tool_shortcutsSubtitle()}
      containerClass="max-w-4xl">

      {lastAction && (
          <div className="info-banner mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" aria-hidden="true" />
            <p>
              {m.tool_shortcutsLastTriggered({ action: lastAction })}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const items = SHORTCUTS.filter((s) => s.category === cat.value);
          if (items.length === 0) return null;
          return (
            <div
              key={cat.value}
                className="panel overflow-hidden"
            >
                <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.52)] px-4 py-2 text-xs font-bold text-foreground">
                {cat.label()}
              </div>
                <div>
                {items.map((s) => (
                  <div
                    key={s.keys}
                      className="data-row flex items-center justify-between px-4 py-3"
                  >
                      <span className="text-sm font-medium text-foreground">{s.label()}</span>
                    <ShortcutBadge keys={s.keys} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

        <div className="warning-banner mt-6 flex items-center gap-3">
          <Keyboard className="h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{m.tool_shortcutsTip()}</p>
        </div>
    </ToolPageLayout>
  );
}

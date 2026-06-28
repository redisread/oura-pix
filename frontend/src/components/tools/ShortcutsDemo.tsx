/**
 * ShortcutsDemo Tool
 *
 * Demo page showing available keyboard shortcuts.
 * Hooks (useKeyboardShortcuts) are also integrated into ImageEditor and other tools.
 */

"use client";

import { useState } from "react";
import { useKeyboardShortcuts, ShortcutBadge } from "@/hooks/useKeyboardShortcuts";
import * as m from "@/paraglide/messages.js";

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
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{m.tool_shortcutsTitle()}</h1>
        <p className="text-sm text-slate-500 mt-1">
          {m.tool_shortcutsSubtitle()}
        </p>
      </div>

      {lastAction && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-200">
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
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {cat.label()}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((s) => (
                  <div
                    key={s.keys}
                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s.label()}</span>
                    <ShortcutBadge keys={s.keys} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
        💡 {m.tool_shortcutsTip()}
      </div>
    </div>
  );
}

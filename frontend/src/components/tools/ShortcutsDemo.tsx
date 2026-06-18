/**
 * ShortcutsDemo Tool
 *
 * Demo page showing available keyboard shortcuts.
 * Hooks (useKeyboardShortcuts) are also integrated into ImageEditor and other tools.
 */

"use client";

import { useState } from "react";
import { useKeyboardShortcuts, ShortcutBadge } from "@/hooks/useKeyboardShortcuts";

const SHORTCUTS = [
  { keys: "Ctrl + Z", label: "撤销", category: "编辑" },
  { keys: "Ctrl + Shift + Z", label: "重做（也支持 Ctrl + Y）", category: "编辑" },
  { keys: "Ctrl + S", label: "保存当前编辑", category: "文件" },
  { keys: "Ctrl + D", label: "下载当前图片", category: "文件" },
  { keys: "Esc", label: "关闭弹窗", category: "导航" },
  { keys: "1 - 9", label: "切换 ImageEditor Tab", category: "导航" },
];

const CATEGORIES = ["编辑", "文件", "导航"] as const;

export default function ShortcutsDemo() {
  const [lastAction, setLastAction] = useState<string | null>(null);

  useKeyboardShortcuts({
    onUndo: () => setLastAction("撤销 (Ctrl+Z)"),
    onRedo: () => setLastAction("重做 (Ctrl+Shift+Z)"),
    onSave: () => setLastAction("保存 (Ctrl+S)"),
    onDownload: () => setLastAction("下载 (Ctrl+D)"),
    onClose: () => setLastAction("关闭 (Esc)"),
    onTabSelect: (idx) => setLastAction(`Tab ${idx + 1} (数字键 ${idx + 1})`),
  });

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">快捷键参考</h1>
        <p className="text-sm text-slate-500 mt-1">
          全局快捷键在图片编辑器和工具页面生效
        </p>
      </div>

      {lastAction && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            最后触发：<span className="font-mono font-medium">{lastAction}</span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {CATEGORIES.map((cat) => {
          const items = SHORTCUTS.filter((s) => s.category === cat);
          if (items.length === 0) return null;
          return (
            <div
              key={cat}
              className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                {cat}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((s) => (
                  <div
                    key={s.keys}
                    className="px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">{s.label}</span>
                    <ShortcutBadge keys={s.keys} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-800 dark:text-amber-200">
        💡 提示：在输入框中输入时，快捷键不会触发，避免误操作。
      </div>
    </div>
  );
}

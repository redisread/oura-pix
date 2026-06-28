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
    <div className="workbench-page">
      <div className="workbench-container max-w-4xl">
        <header className="mb-8 max-w-3xl">
          <p className="page-kicker">Tool bench / Shortcuts</p>
          <h1 className="page-title mt-2">快捷键参考</h1>
          <p className="page-description mt-3">
          全局快捷键在图片编辑器和工具页面生效
        </p>
        </header>

      {lastAction && (
          <div className="info-banner mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4" aria-hidden="true" />
            <p>
              最后触发：<span className="font-utility font-semibold">{lastAction}</span>
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
                className="panel overflow-hidden"
            >
                <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.52)] px-4 py-2 text-xs font-bold text-foreground">
                {cat}
              </div>
                <div>
                {items.map((s) => (
                  <div
                    key={s.keys}
                      className="data-row flex items-center justify-between px-4 py-3"
                  >
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
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
          <p>提示：在输入框中输入时，快捷键不会触发，避免误操作。</p>
        </div>
      </div>
    </div>
  );
}

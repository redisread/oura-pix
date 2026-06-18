/**
 * useKeyboardShortcuts Hook
 *
 * Global keyboard shortcuts for image editing tools.
 *
 * Defaults:
 * - Ctrl/Cmd+Z: undo
 * - Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y: redo
 * - Ctrl/Cmd+S: save
 * - Ctrl/Cmd+D: download
 * - Esc: close modal
 * - 1-9: select tab (consumer-defined)
 */

import { useEffect } from "react";

export interface ShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onDownload?: () => void;
  onClose?: () => void;
  onTabSelect?: (index: number) => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
  const enabled = handlers.enabled !== false;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target as HTMLElement | null)?.isContentEditable === true;

      if (e.key === "Escape" && handlers.onClose) {
        e.preventDefault();
        handlers.onClose();
        return;
      }

      if (isInput) return;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handlers.onRedo?.();
        } else {
          handlers.onUndo?.();
        }
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handlers.onRedo?.();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handlers.onDownload?.();
        return;
      }
      if (e.key >= "1" && e.key <= "9" && handlers.onTabSelect) {
        const idx = Number(e.key) - 1;
        handlers.onTabSelect(idx);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    handlers.onUndo,
    handlers.onRedo,
    handlers.onSave,
    handlers.onDownload,
    handlers.onClose,
    handlers.onTabSelect,
  ]);
}

const BADGE_BASE_CLASS =
  "inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded";

/**
 * ShortcutBadge Component
 * Display keyboard shortcut hint next to buttons.
 */
export function ShortcutBadge({ keys, className }: { keys: string; className?: string }) {
  const cls = className ? `${BADGE_BASE_CLASS} ${className}` : BADGE_BASE_CLASS;
  return <kbd className={cls}>{keys}</kbd>;
}

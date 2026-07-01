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

import { useEffect, useRef } from "react";

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
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        (target as HTMLElement | null)?.isContentEditable === true;

      if (e.key === "Escape" && handlersRef.current.onClose) {
        e.preventDefault();
        handlersRef.current.onClose();
        return;
      }

      if (isInput) return;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handlersRef.current.onRedo?.();
        } else {
          handlersRef.current.onUndo?.();
        }
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handlersRef.current.onRedo?.();
        return;
      }
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handlersRef.current.onSave?.();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handlersRef.current.onDownload?.();
        return;
      }
      if (e.key >= "1" && e.key <= "9" && handlersRef.current.onTabSelect) {
        const idx = Number(e.key) - 1;
        handlersRef.current.onTabSelect(idx);
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
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

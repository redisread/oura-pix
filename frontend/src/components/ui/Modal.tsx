/**
 * Modal — 全局统一弹窗容器
 *
 * 统一 `fixed inset-0 z-50` 弹窗模式，参数化 overlay 透明度与容器尺寸。
 * 替代各文件中重复的 `bg-black/40` / `bg-[hsl(var(--foreground)/0.42)]` 等变体。
 *
 * 设计取舍：
 * - overlay 和 card 完全解耦：overlay 只负责遮罩 + 点击关闭，card 只负责内容容器
 * - size 和 overlay 用参数控制，避免 11 文件各写一份
 * - role="dialog" aria-modal 在组件内部固化，调用方无需关心
 */

import type { ReactNode, HTMLAttributes } from "react";
import * as m from "@/paraglide/messages.js";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

export type OverlayTint = "dark-40" | "dark-70" | "fg-42" | "fg-72" | "fg-78" | "fg-solid";

const OVERLAY_CLASSES: Record<OverlayTint, string> = {
  "dark-40": "bg-black/40",
  "dark-70": "bg-black/70",
  "fg-42": "bg-[hsl(var(--foreground)/0.42)]",
  "fg-72": "bg-[hsl(var(--foreground)/0.72)]",
  "fg-78": "bg-[hsl(var(--foreground)/0.78)]",
  "fg-solid": "bg-[hsl(var(--foreground))]",
};

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: "max-w-sm w-full",
  md: "max-w-md w-full",
  lg: "max-w-lg w-full",
  xl: "max-w-xl w-full",
  full: "max-w-7xl w-full",
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** 弹窗宽度档位，默认 md */
  size?: ModalSize;
  /** overlay 遮罩色调，默认 fg-42 */
  overlay?: OverlayTint;
  /** 容器额外 class（覆盖 panel 风格、padding、高度等） */
  contentClassName?: string;
  /** overlay 额外 class（覆盖 p-4、flex 方向等） */
  overlayClassName?: string;
  /** 点击遮罩是否关闭，默认 true */
  closeOnOverlay?: boolean;
  /** 关闭时是否阻止事件冒泡影响 disabled 状态（如 loading），默认 false */
  contentProps?: HTMLAttributes<HTMLDivElement>;
}

export function Modal({
  open,
  onClose,
  children,
  size = "md",
  overlay = "fg-42",
  contentClassName = "",
  overlayClassName = "",
  closeOnOverlay = true,
  contentProps,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${OVERLAY_CLASSES[overlay]} ${overlayClassName}`}
      onClick={() => closeOnOverlay && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`panel p-6 shadow-xl ${SIZE_CLASSES[size]} ${contentClassName}`}
        onClick={(e) => e.stopPropagation()}
        {...contentProps}
      >
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ConfirmModal — 确认弹窗（危险/警告操作）                             */
/* ------------------------------------------------------------------ */

import { Loader2 } from "lucide-react";

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** 危险级别：danger 红色确认按钮，warning 橙色确认按钮 */
  variant?: "danger" | "warning";
  /** 标题区额外 Icon（如 AlertTriangle） */
  icon?: ReactNode;
}

const BTN_CLASS = {
  danger: "px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium inline-flex items-center gap-2",
  warning: "px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium inline-flex items-center gap-2",
};

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = m.common_confirm(),
  cancelLabel = m.common_cancel(),
  loading = false,
  variant = "danger",
  icon,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      overlay="fg-42"
    >
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h3 className={`text-lg font-semibold ${variant === "danger" ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"}`}>
          {title}
        </h3>
      </div>
      {description && (
        <p className="text-sm text-foreground-muted">{description}</p>
      )}
      <div className="flex justify-end gap-2 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="btn-secondary h-10 px-4"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={BTN_CLASS[variant]}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

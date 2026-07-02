/**
 * ConfirmModal — Settings 确认弹窗（危险操作）
 *
 * 统一「标题 + 描述 + 取消/确认」三件套，用于删除、吊销、退出等场景。
 */

import type { ReactNode } from "react";
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
  confirmLabel = "确认",
  cancelLabel = "取消",
  loading = false,
  variant = "danger",
  icon,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => !loading && onClose()}
    >
      <div className="card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
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
            className="btn-secondary px-4 py-2"
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
      </div>
    </div>
  );
}

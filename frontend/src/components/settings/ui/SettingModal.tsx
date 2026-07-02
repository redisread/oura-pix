/**
 * SettingModal — Settings 弹窗容器
 *
 * 统一 `fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4` 结构，
 * 点击遮罩关闭，内容自定义。
 */

import type { ReactNode } from "react";

export interface SettingModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** card 宽度 class，默认 max-w-md w-full */
  size?: string;
}

export function SettingModal({ open, onClose, children, size = "max-w-md w-full" }: SettingModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={() => onClose()}
    >
      <div
        className={`card p-6 ${size}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

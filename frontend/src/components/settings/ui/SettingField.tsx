/**
 * SettingField — Settings 表单字段标签
 *
 * 统一样式：`text-xs font-medium text-foreground-muted mb-1`
 */

import type { ReactNode } from "react";

export interface SettingFieldProps {
  label: string;
  children: ReactNode;
  /** 提示文案 */
  hint?: string;
  /** 错误文案 */
  error?: string;
}

export function SettingField({ label, children, hint, error }: SettingFieldProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-foreground-muted mb-1">{label}</label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-[hsl(var(--color-error))]">{error}</p>
      )}
      {!error && hint && (
        <p className="mt-1 text-xs text-foreground-muted">{hint}</p>
      )}
    </div>
  );
}

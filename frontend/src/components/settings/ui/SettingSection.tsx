/**
 * SettingSection — Settings 页面标题区
 *
 * 统一 h2 + description 的页面标题样式，可选右侧 action slot（按钮等）。
 */

import type { ReactNode } from "react";

export interface SettingSectionProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  /** 右侧操作区（创建按钮等） */
  actions?: ReactNode;
  /** 是否启用 flex 横向布局（有 actions 时默认 true） */
  split?: boolean;
}

export function SettingSection({ title, description, icon, actions, split }: SettingSectionProps) {
  const useFlex = split ?? Boolean(actions);

  const header = (
    <div>
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-foreground-muted">{description}</p>
      )}
    </div>
  );

  if (!useFlex) return header;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {header}
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

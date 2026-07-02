/**
 * SettingCard — Settings 内容卡片
 *
 * 统一 `card p-6 space-y-4` 容器，可选 icon + title section header。
 */

import type { ReactNode } from "react";

export interface SettingCardProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 卡片内容区额外 class */
  bodyClassName?: string;
  /** 是否使用 danger 风格（红色边框/标题） */
  danger?: boolean;
}

export function SettingCard({ title, icon, children, className = "", bodyClassName = "", danger }: SettingCardProps) {
  return (
    <div
      className={`card p-6 space-y-4${danger ? " border-red-200 dark:border-red-900" : ""} ${className}`}
    >
      {title && (
        <h3
          className={`text-sm font-semibold flex items-center gap-2${
            danger ? " text-red-700 dark:text-red-400" : " text-foreground"
          }`}
        >
          {icon}
          {title}
        </h3>
      )}
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}

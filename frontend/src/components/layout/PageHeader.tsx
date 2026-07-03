/**
 * PageHeader — 工作台页面标题区域
 *
 * 统一 kicker + h1 + description + 可选 action slot 结构。
 */

import type { ReactNode } from "react";

interface PageHeaderProps {
  kicker: string;
  title: ReactNode;
  description?: ReactNode;
  /** 标题行右侧操作区 */
  actions?: ReactNode;
}

export function PageHeader({ kicker, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="page-kicker">{kicker}</p>
        <h1 className="page-title mt-2">{title}</h1>
        {description && (
          <p className="page-description mt-2">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

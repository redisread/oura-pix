/**
 * WorkbenchPageLayout — 工作台页面通用布局
 *
 * 统一 History / Favorites / Profile / Teams 等 workbench 页面的
 * 外层容器结构：`workbench-page` + `workbench-container`。
 */

import type { ReactNode } from "react";

interface WorkbenchPageLayoutProps {
  children: ReactNode;
  /** 可选：限制容器最大宽度（如 `max-w-6xl`） */
  maxWidth?: string;
}

export function WorkbenchPageLayout({ children, maxWidth }: WorkbenchPageLayoutProps) {
  return (
    <div className="workbench-page">
      <div className={maxWidth ? `workbench-container ${maxWidth}` : "workbench-container"}>
        {children}
      </div>
    </div>
  );
}

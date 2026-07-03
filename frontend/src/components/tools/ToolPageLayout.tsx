/**
 * ToolPageLayout — 工具页共享布局
 *
 * 所有 tool 页面统一的三段式结构：workbench-page > workbench-container > header + content。
 * 提供 page-kicker / page-title / page-description 的 header 容器，
 * 以及 workbench 外层 wrapper，避免 6 个工具页各自重复相同 JSX。
 */

import type { ReactNode } from "react";

export interface ToolPageLayoutProps {
  kicker: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  /** 额外添加到 workbench-container 的 class */
  containerClass?: string;
}

export function ToolPageLayout({
  kicker,
  title,
  subtitle,
  children,
  containerClass = "",
}: ToolPageLayoutProps) {
  return (
    <div className="workbench-page">
      <div className={`workbench-container ${containerClass}`.trim()}>
        <header className="mb-8 max-w-3xl">
          <p className="page-kicker">{kicker}</p>
          <h1 className="page-title mt-2">{title}</h1>
          <p className="page-description mt-3">{subtitle}</p>
        </header>
        {children}
      </div>
    </div>
  );
}

/**
 * SettingActions — Settings 卡片底部操作栏
 *
 * 统一 `flex justify-end border-t pt-4`
 */

import type { ReactNode } from "react";

export interface SettingActionsProps {
  children: ReactNode;
  /** 对齐方式，默认 right */
  align?: "left" | "right" | "center" | "between";
  /** 是否显示上边框 */
  bordered?: boolean;
}

const ALIGN_CLASS: Record<NonNullable<SettingActionsProps["align"]>, string> = {
  left: "justify-start",
  right: "justify-end",
  center: "justify-center",
  between: "justify-between",
};

export function SettingActions({ children, align = "right", bordered = true }: SettingActionsProps) {
  return (
    <div
      className={`${ALIGN_CLASS[align]}${bordered ? " border-t border-[hsl(var(--border))] pt-4" : ""} flex gap-2`}
    >
      {children}
    </div>
  );
}

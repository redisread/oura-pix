/**
 * AuthAside — 认证页营销侧边栏
 *
 * 统一 Login / Register / ForgotPassword / ResetPassword 四页共用的
 * 双层 aside 结构：proof-strip + bench-grid + BrandLink + kicker + h2 + description + checklist。
 */

import type { ReactNode } from "react";
import { CheckCircle2 } from "lucide-react";
import BrandLink from "@/components/ui/BrandLink";

export interface AuthAsideProps {
  kicker: string;
  title: ReactNode;
  description: string;
  checklist: string[];
}

export function AuthAside({ kicker, title, description, checklist }: AuthAsideProps) {
  return (
    <aside className="relative hidden overflow-hidden border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] lg:block">
      <div className="proof-strip absolute inset-x-0 top-0 h-2" />
      <div className="bench-grid absolute inset-0 opacity-40" />

      <div className="relative z-10 flex min-h-screen flex-col justify-center px-12 xl:px-20">
        <BrandLink />
        <p className="page-kicker mt-12">{kicker}</p>
        <h2 className="font-display mt-4 max-w-xl text-5xl font-semibold leading-none text-foreground">
          {title}
        </h2>
        <p className="mt-6 max-w-md text-lg text-foreground-muted">{description}</p>
        <div className="card mt-10 overflow-hidden">
          <div className="proof-strip h-2" />
          <div className="space-y-4 p-5">
            {checklist.map((item) => (
              <div key={item} className="flex items-center gap-3 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-5 w-5 text-[hsl(var(--primary))]" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}

'use client';

import type { ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function DocsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("docs");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-semibold text-foreground">
              OuraPix
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/docs" className="text-lg text-muted-foreground hover:text-foreground">
              {t("breadcrumb")}
            </Link>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

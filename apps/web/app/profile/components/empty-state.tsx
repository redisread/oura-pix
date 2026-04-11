"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export function EmptyState() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  return (
    <div className="p-12 text-center">
      <div className="mx-auto h-12 w-12 text-slate-400">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <h3 className="mt-2 text-sm font-medium text-slate-900">{t("history.empty")}</h3>
      <p className="mt-1 text-sm text-slate-500">{t("history.emptyDesc")}</p>
      <div className="mt-6">
        <Link href="/generate">
          <Button>{tCommon("start")}</Button>
        </Link>
      </div>
    </div>
  );
}
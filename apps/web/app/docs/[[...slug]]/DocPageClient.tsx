"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

interface DocPageClientProps {
  page: {
    title: string;
    description?: string;
  };
}

export default function DocPageClient({ page }: DocPageClientProps) {
  const t = useTranslations("docs");

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          {page.title}
        </h1>
        <p className="text-lg text-muted-foreground">
          {page.description}
        </p>
      </div>

      <div className="prose prose-neutral dark:prose-invert max-w-none">
        <p>{t("loading")}</p>
        <p>{t("loadingDesc")}</p>
      </div>

      <div className="mt-12 pt-8 border-t border-border">
        <Link
          href="/docs"
          className="text-primary hover:underline"
        >
          ← {t("backToHome")}
        </Link>
      </div>
    </div>
  );
}

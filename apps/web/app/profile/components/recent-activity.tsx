"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GenerationRecord } from "../types";

interface RecentActivityProps {
  history: GenerationRecord[];
  onViewAll: () => void;
}

export function RecentActivity({ history, onViewAll }: RecentActivityProps) {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t("history.title")}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onViewAll}>
          {tCommon("viewAll")} →
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="flex-shrink-0 w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🖼️</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 line-clamp-1">
                  {item.prompt || "No prompt"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDate(item.createdAt)} · {item.platform} · {item.generatedImages.length} {tCommon("images")}
                </p>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">{t("history.empty")}</p>
              <Link href="/generate">
                <Button className="mt-4">{tCommon("start")}</Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
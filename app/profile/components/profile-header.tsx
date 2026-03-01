"use client";

import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";

export function ProfileHeader() {
  const t = useTranslations("profile");
  const { user } = useAuth();

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{t("title")}</h1>
            <p className="mt-2 text-slate-600">{t("subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
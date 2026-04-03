"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";

export function UserInfoCard() {
  const t = useTranslations("profile");
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("userInfo.title")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-500">{t("userInfo.username")}</p>
            <p className="text-base font-medium text-slate-900">{user?.name || "User"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("userInfo.email")}</p>
            <p className="text-base font-medium text-slate-900">{user?.email || "user@example.com"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("userInfo.memberSince")}</p>
            <p className="text-base font-medium text-slate-900">
            {formatDate((user?.createdAt as string) || "2024-01-01")}
          </p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{t("userInfo.plan")}</p>
            <p className="text-base font-medium text-slate-900">{t("userInfo.proPlan")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
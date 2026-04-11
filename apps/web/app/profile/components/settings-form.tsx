"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";

export function SettingsForm() {
  const t = useTranslations("profile");
  const { user } = useAuth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tabs.settings")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <Label htmlFor="username">{t("userInfo.username")}</Label>
            <Input
              id="username"
              type="text"
              defaultValue={user?.name || ""}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">{t("userInfo.email")}</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email || ""}
              disabled
              className="mt-1 bg-slate-50"
            />
            <p className="mt-1 text-xs text-slate-500">{t("userInfo.emailDisabled")}</p>
          </div>
          <div className="flex gap-3">
            <Button>{t("saveChanges")}</Button>
            <Button variant="outline">{t("cancel")}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
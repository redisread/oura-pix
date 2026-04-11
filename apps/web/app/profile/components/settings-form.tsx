"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

export function SettingsForm() {
  const t = useTranslations("profile");
  const { user, refresh } = useAuth();
  const { toast } = useToast();

  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: t("settings.saveFailed"),
        description: t("settings.nameRequired"),
      });
      return;
    }

    setIsSaving(true);

    try {
      const response = await api.put("/api/user/profile", { name: name.trim() });
      if (response.data?.success) {
        toast({
          title: t("settings.saved"),
          description: t("settings.savedDesc"),
        });
        await refresh();
      } else {
        throw new Error(response.data?.error?.message || t("settings.saveFailedDesc"));
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t("settings.saveFailed"),
        description: error instanceof Error ? error.message : t("settings.saveFailedDesc"),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setName(user?.name || "");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tabs.settings")}</CardTitle>
        <CardDescription>{t("settings.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username">{t("userInfo.username")}</Label>
            <Input
              id="username"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("userInfo.usernamePlaceholder")}
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
            <Button type="submit" disabled={isSaving}>
              {isSaving ? t("saving") : t("saveChanges")}
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

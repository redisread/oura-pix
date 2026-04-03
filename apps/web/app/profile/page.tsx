"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { useGenerationHistory } from "./hooks/use-generation-history";
import { ProfileHeader } from "./components/profile-header";
import { StatsCards } from "./components/stats-cards";
import { UserInfoCard } from "./components/user-info-card";
import { RecentActivity } from "./components/recent-activity";
import { GenerationHistory } from "./components/generation-history";
import { HistoryFilters } from "./components/history-filters";
import { HistoryDetailModal } from "./components/history-detail-modal";
import { SettingsForm } from "./components/settings-form";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { GenerationRecord, ProfileTab } from "./types";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  // 从 URL 参数读取初始 tab
  const tabParam = searchParams.get("tab");

  // 状态
  const [activeTab, setActiveTab] = useState<ProfileTab>(
    (tabParam as ProfileTab) || "overview"
  );
  const [selectedRecord, setSelectedRecord] = useState<GenerationRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // 使用自定义 hook 获取数据
  const {
    history,
    stats,
    isLoading,
    isLoadingStats,
    currentPage,
    pagination,
    timeFilter,
    setTimeFilter,
    handlePageChange,
    handleDelete,
    refresh,
  } = useGenerationHistory({ isAuthenticated });

  // 未登录时重定向到登录页
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // 当 URL 参数变化时同步更新 tab
  useEffect(() => {
    if (tabParam && ["overview", "history", "settings"].includes(tabParam)) {
      setActiveTab(tabParam as ProfileTab);
    }
  }, [tabParam]);

  // 加载中状态
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  // 未登录时不渲染内容
  if (!isAuthenticated) {
    return null;
  }

  // 查看详情
  const handleViewDetail = (record: GenerationRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // 删除确认
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  // 确认删除
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;

    const success = await handleDelete(deleteConfirmId);
    if (success) {
      toast({
        title: t("history.deleteSuccess"),
        description: t("history.deleteSuccessDesc"),
      });
    } else {
      toast({
        variant: "destructive",
        title: t("history.deleteFailed"),
        description: t("history.deleteFailedDesc"),
      });
    }
    setDeleteConfirmId(null);
  };

  // Tab 切换处理
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ProfileTab);
  };

  // 切换到历史 Tab
  const handleViewAllHistory = () => {
    setActiveTab("history");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <ProfileHeader />

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="bg-transparent h-auto p-0">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none py-4 px-4"
              >
                {t("tabs.overview")}
              </TabsTrigger>
              <TabsTrigger
                value="history"
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none py-4 px-4"
              >
                {t("tabs.history")}
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:border-b-2 data-[state=active]:border-slate-900 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none py-4 px-4"
              >
                {t("tabs.settings")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6 mt-0">
            <StatsCards stats={stats} isLoading={isLoadingStats} />
            <UserInfoCard />
            <RecentActivity history={history} onViewAll={handleViewAllHistory} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6 mt-0">
            <HistoryFilters timeFilter={timeFilter} onFilterChange={setTimeFilter} />
            <GenerationHistory
              history={history}
              pagination={pagination}
              isLoading={isLoading}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onViewDetail={handleViewDetail}
              onDelete={handleDeleteClick}
            />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-0">
            <SettingsForm />
          </TabsContent>
        </Tabs>
      </div>

      {/* 详情弹窗 */}
      <HistoryDetailModal
        record={selectedRecord}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
      />

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("history.deleteConfirmTitle")}</DialogTitle>
            <DialogDescription>{t("history.deleteConfirm")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              {t("cancel")}
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              {t("history.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
"use client";

export const runtime = "edge";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";

// 生成历史数据类型
interface GenerationRecord {
  id: string;
  prompt: string;
  platform: string;
  style: string;
  language: string;
  count: number;
  uploadedImages: string[];
  generatedImages: string[];
  createdAt: string;
  status: "completed" | "processing" | "failed";
}

// 模拟生成历史数据
const mockGenerationHistory: GenerationRecord[] = [
  {
    id: "gen-001",
    prompt: "高端运动鞋，白色背景，专业产品摄影，突出细节和质感",
    platform: "amazon",
    style: "minimal",
    language: "zh",
    count: 5,
    uploadedImages: ["/uploads/shoe-1.jpg"],
    generatedImages: [
      "/generated/shoe-1-1.jpg",
      "/generated/shoe-1-2.jpg",
      "/generated/shoe-1-3.jpg",
      "/generated/shoe-1-4.jpg",
      "/generated/shoe-1-5.jpg",
    ],
    createdAt: new Date().toISOString(),
    status: "completed",
  },
  {
    id: "gen-002",
    prompt: "无线蓝牙耳机，科技感，黑色背景，蓝光灯效",
    platform: "shopify",
    style: "tech",
    language: "en",
    count: 8,
    uploadedImages: ["/uploads/earbuds-1.jpg", "/uploads/earbuds-2.jpg"],
    generatedImages: [
      "/generated/earbuds-1-1.jpg",
      "/generated/earbuds-1-2.jpg",
      "/generated/earbuds-1-3.jpg",
    ],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "gen-003",
    prompt: "手工陶瓷咖啡杯，温馨家居场景，自然光线",
    platform: "custom",
    style: "lifestyle",
    language: "zh",
    count: 6,
    uploadedImages: ["/uploads/cup-1.jpg"],
    generatedImages: [
      "/generated/cup-1-1.jpg",
      "/generated/cup-1-2.jpg",
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "gen-004",
    prompt: "智能手表，运动风格，户外场景",
    platform: "amazon",
    style: "tech",
    language: "en",
    count: 4,
    uploadedImages: ["/uploads/watch-1.jpg"],
    generatedImages: [
      "/generated/watch-1-1.jpg",
      "/generated/watch-1-2.jpg",
      "/generated/watch-1-3.jpg",
      "/generated/watch-1-4.jpg",
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "gen-005",
    prompt: "真皮手提包，奢侈品风格，精致细节",
    platform: "shopify",
    style: "luxury",
    language: "zh",
    count: 6,
    uploadedImages: ["/uploads/bag-1.jpg", "/uploads/bag-2.jpg"],
    generatedImages: [
      "/generated/bag-1-1.jpg",
      "/generated/bag-1-2.jpg",
    ],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
  {
    id: "gen-006",
    prompt: "护肤品套装，清新自然风格，柔和光线",
    platform: "custom",
    style: "lifestyle",
    language: "zh",
    count: 5,
    uploadedImages: ["/uploads/skincare-1.jpg"],
    generatedImages: [
      "/generated/skincare-1-1.jpg",
      "/generated/skincare-1-2.jpg",
      "/generated/skincare-1-3.jpg",
    ],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    status: "completed",
  },
];

type TimeFilter = "all" | "today" | "week" | "month";

// 图片展示组件
function ImageThumbnail({
  src,
  alt,
  onClick,
}: {
  src: string;
  alt: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative aspect-square bg-slate-100 rounded-lg overflow-hidden ${
        onClick ? "cursor-pointer hover:opacity-80 transition-opacity" : ""
      }`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <span className="absolute bottom-1 right-1 text-[10px] text-slate-400 truncate max-w-full px-1">
        {alt}
      </span>
    </div>
  );
}

// 详情弹窗组件
function DetailModal({
  record,
  isOpen,
  onClose,
  t,
}: {
  record: GenerationRecord | null;
  isOpen: boolean;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">
            {t("profile.history.detailModal.title")}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-slate-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">{t("profile.history.detailModal.createdAt")}</p>
              <p className="text-base font-medium text-slate-900">
                {formatDate(record.createdAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("profile.history.detailModal.status")}</p>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  record.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : record.status === "processing"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {record.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("profile.history.platform")}</p>
              <p className="text-base font-medium text-slate-900 capitalize">{record.platform}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">{t("profile.history.style")}</p>
              <p className="text-base font-medium text-slate-900 capitalize">{record.style}</p>
            </div>
          </div>

          {/* 提示词 */}
          <div>
            <p className="text-sm text-slate-500 mb-2">{t("profile.history.detailModal.promptUsed")}</p>
            <div className="bg-slate-50 rounded-lg p-4">
              <p className="text-sm text-slate-700">{record.prompt}</p>
            </div>
          </div>

          {/* 原始图片 */}
          <div>
            <p className="text-sm text-slate-500 mb-3">
              {t("profile.history.detailModal.originalImages")} ({record.uploadedImages.length})
            </p>
            <div className="grid grid-cols-4 gap-3">
              {record.uploadedImages.map((img, idx) => (
                <ImageThumbnail key={idx} src={img} alt={`Original ${idx + 1}`} />
              ))}
            </div>
          </div>

          {/* 生成结果 */}
          <div>
            <p className="text-sm text-slate-500 mb-3">
              {t("profile.history.detailModal.generatedResults")} ({record.generatedImages.length})
            </p>
            <div className="grid grid-cols-4 gap-3">
              {record.generatedImages.map((img, idx) => (
                <ImageThumbnail key={idx} src={img} alt={`Result ${idx + 1}`} />
              ))}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "history" | "settings">("overview");
  const [history, setHistory] = useState<GenerationRecord[]>(mockGenerationHistory);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState<GenerationRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const itemsPerPage = 5;

  // 未登录时重定向到登录页
  if (!isLoading && !isAuthenticated) {
    router.push("/login");
    return null;
  }

  // 时间筛选逻辑
  const filteredHistory = useMemo(() => {
    const now = new Date();
    return history.filter((item) => {
      const itemDate = new Date(item.createdAt);
      switch (timeFilter) {
        case "today":
          return itemDate.toDateString() === now.toDateString();
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return itemDate >= weekAgo;
        case "month":
          return (
            itemDate.getMonth() === now.getMonth() &&
            itemDate.getFullYear() === now.getFullYear()
          );
        default:
          return true;
      }
    });
  }, [history, timeFilter]);

  // 分页逻辑
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(start, start + itemsPerPage);
  }, [filteredHistory, currentPage]);

  // 删除记录
  const handleDelete = (id: string) => {
    if (window.confirm(t("profile.history.deleteConfirm"))) {
      setHistory((prev) => prev.filter((item) => item.id !== id));
      // 如果当前页没有数据了，回到上一页
      const newTotalPages = Math.ceil((filteredHistory.length - 1) / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    }
  };

  // 查看详情
  const handleViewDetail = (record: GenerationRecord) => {
    setSelectedRecord(record);
    setIsDetailModalOpen(true);
  };

  // 统计数据
  const stats = {
    totalGenerations: history.length,
    thisMonth: history.filter(
      (g) => new Date(g.createdAt).getMonth() === new Date().getMonth()
    ).length,
    remainingCredits: 195,
    favoriteStyle: "极简风格",
  };

  // 筛选按钮组件
  const FilterButton = ({
    value,
    label,
  }: {
    value: TimeFilter;
    label: string;
  }) => (
    <button
      onClick={() => {
        setTimeFilter(value);
        setCurrentPage(1);
      }}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        timeFilter === value
          ? "bg-slate-900 text-white"
          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {(["overview", "history", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {t(`tabs.${tab}`)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-blue-100 rounded-lg">
                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500">{t("stats.totalGenerations")}</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.totalGenerations}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-green-100 rounded-lg">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500">{t("stats.thisMonth")}</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.thisMonth}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg">
                    <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500">{t("stats.remainingCredits")}</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.remainingCredits}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-3 bg-orange-100 rounded-lg">
                    <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-slate-500">{t("stats.favoriteStyle")}</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.favoriteStyle}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{t("userInfo.username")}</h3>
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
                  <p className="text-base font-medium text-slate-900">{formatDate("2024-01-01")}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">{t("userInfo.plan")}</p>
                  <p className="text-base font-medium text-slate-900">专业版</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">{t("history.title")}</h3>
                <button
                  onClick={() => setActiveTab("history")}
                  className="text-sm text-slate-900 hover:underline"
                >
                  {tCommon("viewAll") || "查看全部"} →
                </button>
              </div>
              <div className="space-y-4">
                {history.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                    <div className="flex-shrink-0 w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🖼️</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 line-clamp-1">{item.prompt}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {formatDate(item.createdAt)} · {item.platform} · {item.generatedImages.length} {tCommon("images") || "张图片"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* 筛选栏 */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm text-slate-500">{tCommon("filter") || "筛选"}:</span>
                <FilterButton value="all" label={t("history.filter.all")} />
                <FilterButton value="today" label={t("history.filter.today")} />
                <FilterButton value="week" label={t("history.filter.week")} />
                <FilterButton value="month" label={t("history.filter.month")} />
              </div>
            </div>

            {/* 历史记录列表 */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{t("history.title")}</h2>
                    <p className="mt-1 text-slate-600">{t("history.subtitle")}</p>
                  </div>
                  <p className="text-sm text-slate-500">
                    {t("history.pagination.total", { count: filteredHistory.length })}
                  </p>
                </div>
              </div>

              {paginatedHistory.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="mx-auto h-12 w-12 text-slate-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-2 text-sm font-medium text-slate-900">{t("history.empty")}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t("history.emptyDesc")}</p>
                  <div className="mt-6">
                    <Link
                      href="/generate"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-slate-900 hover:bg-slate-800"
                    >
                      {tCommon("start") || "开始生成"}
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-200">
                    {paginatedHistory.map((item) => (
                      <div key={item.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900">{item.prompt}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                              <span>{formatDate(item.createdAt)}</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded">{item.platform}</span>
                              <span className="px-2 py-0.5 bg-slate-100 rounded">{item.style}</span>
                            </div>

                            {/* 上传的图片 */}
                            {item.uploadedImages.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-slate-500 mb-2">{t("history.uploadedImages")}</p>
                                <div className="flex gap-2">
                                  {item.uploadedImages.map((img, idx) => (
                                    <ImageThumbnail
                                      key={idx}
                                      src={img}
                                      alt={`Upload ${idx + 1}`}
                                      onClick={() => handleViewDetail(item)}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 生成的图片 */}
                            {item.generatedImages.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-slate-500 mb-2">{t("history.generatedImages")}</p>
                                <div className="flex gap-2">
                                  {item.generatedImages.slice(0, 4).map((img, idx) => (
                                    <ImageThumbnail
                                      key={idx}
                                      src={img}
                                      alt={`Result ${idx + 1}`}
                                      onClick={() => handleViewDetail(item)}
                                    />
                                  ))}
                                  {item.generatedImages.length > 4 && (
                                    <div
                                      onClick={() => handleViewDetail(item)}
                                      className="aspect-square w-16 bg-slate-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
                                    >
                                      <span className="text-sm text-slate-600">
                                        +{item.generatedImages.length - 4}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="ml-4 flex flex-col gap-2">
                            <button
                              onClick={() => handleViewDetail(item)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
                            >
                              {t("history.viewDetails")}
                            </button>
                            <button className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded hover:bg-slate-800">
                              {t("history.regenerate")}
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded hover:bg-red-50"
                            >
                              {t("history.delete")}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 分页 */}
                  {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("history.pagination.prev")}
                      </button>
                      <span className="text-sm text-slate-600">
                        {t("history.pagination.page")} {currentPage} {t("history.pagination.of")} {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("history.pagination.next")}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">{t("tabs.settings")}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700">{t("userInfo.username")}</label>
                <input
                  type="text"
                  defaultValue={user?.name || ""}
                  className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-slate-900 focus:ring-slate-900 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">{t("userInfo.email")}</label>
                <input
                  type="email"
                  defaultValue={user?.email || ""}
                  disabled
                  className="mt-1 block w-full rounded-md border-slate-300 bg-slate-50 shadow-sm sm:text-sm"
                />
                <p className="mt-1 text-xs text-slate-500">邮箱不可修改</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800">
                  {t("saveChanges")}
                </button>
                <button className="px-4 py-2 bg-white text-slate-700 border border-slate-300 text-sm font-medium rounded-md hover:bg-slate-50">
                  {t("cancel")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 详情弹窗 */}
      <DetailModal
        record={selectedRecord}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        t={t}
      />
    </div>
  );
}

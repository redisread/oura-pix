"use client";

import { useState } from "react";
import * as m from "@/paraglide/messages.js";
import { useAuth } from "@/hooks/use-auth";

// Mock data for development
type ProfileTab = "overview" | "history" | "settings";

interface GenerationRecord {
  id: string;
  prompt: string;
  platform: string;
  style: string;
  language: string;
  createdAt: string;
  status: "completed" | "processing" | "failed";
}

const mockHistory: GenerationRecord[] = [
  {
    id: "1",
    prompt: "高端无线蓝牙耳机",
    platform: "Amazon",
    style: "简约现代",
    language: "中文",
    createdAt: "2024-01-15 10:30",
    status: "completed",
  },
  {
    id: "2",
    prompt: "智能手表",
    platform: "Temu",
    style: "科技感",
    language: "英文",
    createdAt: "2024-01-14 15:20",
    status: "completed",
  },
];

// Stats Cards Component
function StatsCards() {
  const stats = [
    {
      label: m.profile_stats_totalGenerations(),
      value: 12,
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: "bg-blue-100",
    },
    {
      label: m.profile_stats_thisMonth(),
      value: 5,
      icon: (
        <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      bgColor: "bg-green-100",
    },
    {
      label: m.profile_stats_remainingCredits(),
      value: 195,
      icon: (
        <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      bgColor: "bg-purple-100",
    },
    {
      label: m.profile_stats_favoriteStyle(),
      value: "简约现代",
      icon: (
        <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((item, index) => (
        <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 ${item.bgColor} rounded-lg`}>
                {item.icon}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// User Info Card Component
function UserInfoCard() {
  const { user } = useAuth();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">{m.profile_userInfo_title()}</h3>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-slate-500">{m.profile_userInfo_username()}</p>
            <p className="text-base font-medium text-slate-900">{user?.name || "User"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{m.profile_userInfo_email()}</p>
            <p className="text-base font-medium text-slate-900">{user?.email || "user@example.com"}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{m.profile_userInfo_memberSince()}</p>
            <p className="text-base font-medium text-slate-900">2024-01-01</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">{m.profile_userInfo_plan()}</p>
            <p className="text-base font-medium text-slate-900">{m.profile_userInfo_proPlan()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Generation History Component
function GenerationHistory() {
  const handleDelete = (_id: string) => {
    // TODO: Implement delete functionality
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">{m.profile_history_title()}</h3>
        <p className="mt-1 text-sm text-slate-500">{m.profile_history_subtitle()}</p>
      </div>
      <div className="p-0">
        {mockHistory.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{m.profile_history_empty()}</h3>
            <p className="mt-2 text-slate-500">{m.profile_history_emptyDesc()}</p>
            <a
              href="/generate"
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              {m.profile_history_startGenerating()}
            </a>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {mockHistory.map((item) => (
              <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-medium text-slate-900">{item.prompt}</h4>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : item.status === "processing"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status === "completed"
                          ? m.profile_history_status_completed()
                          : item.status === "processing"
                          ? m.profile_history_status_processing()
                          : m.profile_history_status_failed()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.platform} · {item.style} · {item.language}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">{item.createdAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm text-slate-600 hover:text-slate-900 px-3 py-1 rounded-md hover:bg-slate-100 transition-colors">
                      {m.profile_history_viewDetail()}
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                      {m.profile_history_delete()}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Settings Form Component
function SettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">{m.profile_settings_title()}</h3>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Profile Section */}
        <div>
          <h4 className="text-sm font-medium text-slate-900 mb-4">{m.profile_settings_profile()}</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {m.profile_userInfo_username()}
              </label>
              <input
                type="text"
                defaultValue={user?.name || ""}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {m.profile_userInfo_email()}
              </label>
              <input
                type="email"
                defaultValue={user?.email || ""}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="pt-6 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-900 mb-4">{m.profile_settings_password()}</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                当前密码
              </label>
              <input
                type="password"
                placeholder="请输入当前密码"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                新密码
              </label>
              <input
                type="password"
                placeholder="请输入新密码"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm transition-colors focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="pt-6 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-900 mb-4">{m.profile_settings_notifications()}</h4>
          <div className="space-y-3">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-generation"
                defaultChecked
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="notify-generation" className="ml-2 text-sm text-slate-700">
                生成完成时通知我
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="notify-marketing"
                className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="notify-marketing" className="ml-2 text-sm text-slate-700">
                接收营销邮件
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-6 border-t border-slate-200">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? m.profile_settings_saving() : m.profile_settings_save()}
          </button>
        </div>
      </form>
    </div>
  );
}

// Main Profile Page Component
export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<ProfileTab>("overview");
  const { user, isLoading: isAuthLoading } = useAuth();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">{m.profile_loading()}</div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as ProfileTab, label: m.profile_tabs_overview() },
    { id: "history" as ProfileTab, label: m.profile_tabs_history() },
    { id: "settings" as ProfileTab, label: m.profile_tabs_settings() },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{m.profile_title()}</h1>
              <p className="mt-2 text-slate-600">{m.profile_subtitle()}</p>
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
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-slate-900 text-slate-900"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <StatsCards />
            <UserInfoCard />
            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">最近活动</h3>
              </div>
              <div className="p-6">
                {mockHistory.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-3">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                      <svg className="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-900">{item.prompt}</p>
                      <p className="text-xs text-slate-500">{item.createdAt}</p>
                    </div>
                    <span className="text-xs text-slate-400">{item.platform}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <GenerationHistory />
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <SettingsForm />
          </div>
        )}
      </div>
    </div>
  );
}

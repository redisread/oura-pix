/**
 * NotificationPanel Component
 *
 * Dropdown panel showing notification list
 */

"use client";

import { useEffect, useRef } from "react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { formatLocaleDate } from "@/lib/locale";

interface NotificationPanelProps {
  onClose: () => void;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return m.common_justNow();
  if (diffMins < 60) return m.common_minutesAgo({ count: diffMins.toString() });
  if (diffHours < 24) return m.common_hoursAgo({ count: diffHours.toString() });
  if (diffDays < 7) return m.common_daysAgo({ count: diffDays.toString() });
  return formatLocaleDate(date);
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "generation_complete":
      return "✅";
    case "generation_failed":
      return "❌";
    case "system_announcement":
      return "📢";
    case "account_update":
      return "👤";
    case "subscription_renewal":
      return "💳";
    case "subscription_expiring":
      return "⚠️";
    default:
      return "🔔";
  }
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const handleClick = () => {
    if (!notification.isRead) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      window.location.href = notification.link.startsWith("/")
        ? localizeHref(notification.link)
        : notification.link;
    }
  };

  return (
    <div
      className={`p-4 border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
        !notification.isRead ? "bg-blue-50 dark:bg-blue-900/10" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">
          {getNotificationIcon(notification.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {notification.title}
            </h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              aria-label={m.notification_delete()}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
            {notification.message}
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
            {formatTimeAgo(notification.createdAt)}
          </p>
        </div>

        {!notification.isRead && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

export default function NotificationPanel({ onClose }: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
  } = useNotifications();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {m.notification_title()}
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
              ({m.notification_unreadCount({ count: unreadCount.toString() })})
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {m.notification_markAllRead()}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="overflow-y-auto max-h-[400px]">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3" />
            <p>{m.common_loading()}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-500 dark:text-red-400 mb-3">{error}</p>
            <button
              onClick={fetchNotifications}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              {m.common_retry()}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            <svg
              className="w-16 h-16 mx-auto mb-3 text-slate-300 dark:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <p>{m.notification_empty()}</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={markAsRead}
              onDelete={deleteNotification}
            />
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 text-center">
          <a
            href={localizeHref("/notifications")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            {m.notification_viewAll()}
          </a>
        </div>
      )}
    </div>
  );
}

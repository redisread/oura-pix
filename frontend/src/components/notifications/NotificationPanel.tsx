/**
 * NotificationPanel Component
 *
 * Dropdown panel showing notification list
 */

"use client";

import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  Megaphone,
  User,
  X,
  XCircle,
} from "lucide-react";
import * as m from "@/paraglide/messages.js";
import { localizeHref } from "@/paraglide/runtime.js";
import { useNotifications, type Notification } from "@/hooks/useNotifications";

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
  return date.toLocaleDateString("zh-CN");
}

function NotificationTypeIcon({ type }: { type: string }) {
  const className = "h-5 w-5";
  switch (type) {
    case "generation_complete":
      return <CheckCircle2 className={className} aria-hidden="true" />;
    case "generation_failed":
      return <XCircle className={className} aria-hidden="true" />;
    case "system_announcement":
      return <Megaphone className={className} aria-hidden="true" />;
    case "account_update":
      return <User className={className} aria-hidden="true" />;
    case "subscription_renewal":
      return <CreditCard className={className} aria-hidden="true" />;
    case "subscription_expiring":
      return <AlertTriangle className={className} aria-hidden="true" />;
    default:
      return <Bell className={className} aria-hidden="true" />;
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
      className={`data-row cursor-pointer p-4 transition-colors ${
        !notification.isRead ? "bg-[hsl(var(--primary)/0.08)]" : ""
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--primary))]">
          <NotificationTypeIcon type={notification.type} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-semibold text-foreground">{notification.title}</h4>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="icon-button h-7 w-7 flex-shrink-0 hover:text-[hsl(var(--color-error))]"
              aria-label="Delete notification"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">{notification.message}</p>
          <p className="font-utility mt-2 text-xs text-foreground-muted">{formatTimeAgo(notification.createdAt)}</p>
        </div>

        {!notification.isRead && (
          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-[hsl(var(--primary))]" />
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

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
      className="panel absolute right-0 top-full z-50 mt-2 max-h-[500px] w-96 overflow-hidden shadow-xl"
    >
      <div className="flex items-center justify-between border-b border-[hsl(var(--border))] p-4">
        <h3 className="text-lg font-semibold text-foreground">
          {m.notification_title()}
          {unreadCount > 0 && (
            <span className="ml-2 text-sm font-normal text-foreground-muted">
              ({m.notification_unreadCount({ count: unreadCount.toString() })})
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]"
          >
            {m.notification_markAllRead()}
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-foreground-muted">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-b-2 border-[hsl(var(--primary))]" />
            <p>{m.common_loading()}</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="mb-3 text-[hsl(var(--color-error))]">{error}</p>
            <button
              onClick={fetchNotifications}
              className="text-sm font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]"
            >
              {m.common_retry()}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-foreground-muted">
            <Bell className="mx-auto mb-3 h-16 w-16" aria-hidden="true" />
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

      {notifications.length > 0 && (
        <div className="border-t border-[hsl(var(--border))] p-3 text-center">
          <a
            href={localizeHref("/notifications")}
            className="text-sm font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--primary-hover))]"
          >
            {m.notification_viewAll()}
          </a>
        </div>
      )}
    </div>
  );
}

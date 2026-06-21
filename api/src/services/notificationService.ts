/**
 * Notifications Service
 *
 * Handles notification creation and management
 */

import { createDb, schema } from "@oura-pix/database";
import { eq, and, desc, sql } from "drizzle-orm";
import type { NotificationTypeType } from "@oura-pix/database";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationTypeType;
  title: string;
  message: string;
  link?: string;
  resourceId?: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationTypeType;
  title: string;
  message: string;
  link: string | null;
  resourceId: string | null;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Create a new notification
 */
export async function createNotification(
  db: ReturnType<typeof createDb>,
  input: CreateNotificationInput
): Promise<Notification> {
  const [notification] = await db
    .insert(schema.notifications)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      link: input.link || null,
      resourceId: input.resourceId || null,
      isRead: false,
      createdAt: new Date(),
    })
    .returning();

  return notification!;
}

/**
 * Get notifications for a user
 */
export async function getUserNotifications(
  db: ReturnType<typeof createDb>,
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  } = {}
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  const { limit = 20, offset = 0, unreadOnly = false } = options;

  // Build where clause
  const whereClause = unreadOnly
    ? and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false))
    : eq(schema.notifications.userId, userId);

  // Get notifications
  const notificationsList = await db
    .select()
    .from(schema.notifications)
    .where(whereClause)
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(eq(schema.notifications.userId, userId));

  // Get unread count
  const unreadResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(
      and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false))
    );

  return {
    notifications: notificationsList,
    total: totalResult[0]?.count || 0,
    unreadCount: unreadResult[0]?.count || 0,
  };
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  db: ReturnType<typeof createDb>,
  notificationId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .update(schema.notifications)
    .set({ isRead: true })
    .where(
      and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId))
    )
    .returning();

  return result.length > 0;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsRead(
  db: ReturnType<typeof createDb>,
  userId: string
): Promise<number> {
  const result = await db
    .update(schema.notifications)
    .set({ isRead: true })
    .where(
      and(eq(schema.notifications.userId, userId), eq(schema.notifications.isRead, false))
    )
    .returning();

  return result.length;
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  db: ReturnType<typeof createDb>,
  notificationId: string,
  userId: string
): Promise<boolean> {
  const result = await db
    .delete(schema.notifications)
    .where(
      and(eq(schema.notifications.id, notificationId), eq(schema.notifications.userId, userId))
    )
    .returning();

  return result.length > 0;
}

/**
 * Create notification for generation completion
 */
export async function notifyGenerationComplete(
  db: ReturnType<typeof createDb>,
  userId: string,
  generationId: string,
  imageCount: number
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: "generation_complete",
    title: "生成完成",
    message: `您的 ${imageCount} 张图片已生成完成`,
    link: `/history/${generationId}`,
    resourceId: generationId,
  });
}

/**
 * Create notification for generation failure
 */
export async function notifyGenerationFailed(
  db: ReturnType<typeof createDb>,
  userId: string,
  generationId: string,
  errorMessage: string
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: "generation_failed",
    title: "生成失败",
    message: `生成失败: ${errorMessage}`,
    link: `/history/${generationId}`,
    resourceId: generationId,
  });
}

/**
 * Create notification for subscription renewal
 */
export async function notifySubscriptionRenewal(
  db: ReturnType<typeof createDb>,
  userId: string,
  planName: string
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: "subscription_renewal",
    title: "订阅已续期",
    message: `您的 ${planName} 订阅已成功续期`,
    link: "/settings/subscription",
  });
}

/**
 * Create notification for subscription expiring
 */
export async function notifySubscriptionExpiring(
  db: ReturnType<typeof createDb>,
  userId: string,
  daysLeft: number
): Promise<Notification> {
  return createNotification(db, {
    userId,
    type: "subscription_expiring",
    title: "订阅即将到期",
    message: `您的订阅将在 ${daysLeft} 天后到期，请及时续期`,
    link: "/settings/subscription",
  });
}

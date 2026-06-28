/**
 * Notifications Routes
 *
 * API endpoints for notification management
 */

import { Hono } from "hono";
import { createDb } from "@oura-pix/database";
import { getUser } from "../middleware/auth";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/notificationService";
import { apiMessage } from "../lib/i18n";

const notifications = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

/**
 * GET /api/notifications
 * Get notifications for current user
 */
notifications.get("/", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const limit = Number(c.req.query("limit")) || 20;
  const offset = Number(c.req.query("offset")) || 0;
  const unreadOnly = c.req.query("unreadOnly") === "true";

  try {
    const db = createDb(c.env.DB);
    const result = await getUserNotifications(db, user.id, {
      limit,
      offset,
      unreadOnly,
    });

    return c.json({
      success: true,
      data: {
        notifications: result.notifications,
        total: result.total,
        unreadCount: result.unreadCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
notifications.put("/:id/read", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const success = await markNotificationRead(db, id, user.id);

    if (!success) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
notifications.put("/read-all", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  try {
    const db = createDb(c.env.DB);
    const count = await markAllNotificationsRead(db, user.id);

    return c.json({
      success: true,
      data: { markedCount: count },
    });
  } catch (error) {
    console.error("Failed to mark all notifications as read:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
notifications.delete("/:id", async (c) => {
  const user = await getUser(c);
  if (!user) {
    return c.json({ success: false, error: { code: "UNAUTHORIZED", message: apiMessage(c, "unauthorized") } }, 401);
  }

  const id = c.req.param("id");

  try {
    const db = createDb(c.env.DB);
    const success = await deleteNotification(db, id, user.id);

    if (!success) {
      return c.json({ success: false, error: { code: "NOT_FOUND", message: apiMessage(c, "notFound") } }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to delete notification:", error);
    return c.json({ success: false, error: { code: "INTERNAL_ERROR", message: apiMessage(c, "internalError") } }, 500);
  }
});

export default notifications;

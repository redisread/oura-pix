/**
 * Notifications Routes
 *
 * API endpoints for notification management
 */

import { createRouter, useCtx } from "../lib/route";
import { notFound } from "../lib/http";
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/notificationService";

const notifications = createRouter();

/**
 * GET /api/notifications
 * Get notifications for current user
 */
notifications.get("/", async (c) => {
  const { user, db } = useCtx(c);

  const limit = Number(c.req.query("limit")) || 20;
  const offset = Number(c.req.query("offset")) || 0;
  const unreadOnly = c.req.query("unreadOnly") === "true";

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
});

/**
 * PUT /api/notifications/:id/read
 * Mark a notification as read
 */
notifications.put("/:id/read", async (c) => {
  const { user, db } = useCtx(c);

  const id = c.req.param("id");
  const success = await markNotificationRead(db, id, user.id);
  if (!success) return notFound(c);
  return c.json({ success: true });
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
notifications.put("/read-all", async (c) => {
  const { user, db } = useCtx(c);

  const count = await markAllNotificationsRead(db, user.id);
  return c.json({
    success: true,
    data: { markedCount: count },
  });
});

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
notifications.delete("/:id", async (c) => {
  const { user, db } = useCtx(c);

  const id = c.req.param("id");
  const success = await deleteNotification(db, id, user.id);
  if (!success) return notFound(c);
  return c.json({ success: true });
});

export default notifications;

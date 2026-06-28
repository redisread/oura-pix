/**
 * Stats Routes
 *
 * API endpoints for generation statistics
 */

import { Hono } from 'hono';
import { getUser } from '../middleware/auth';
import { getUserStats, type TimeRange } from '../services/statsService';
import { createDb } from '@oura-pix/database';
import { apiMessage } from "../lib/i18n";

const stats = new Hono<{
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: { id: string; email: string; name?: string | null };
    session: { id: string; expiresAt: Date };
  };
}>();

/**
 * GET /api/stats
 * Get user generation statistics
 *
 * Query params:
 * - range: TimeRange (7d | 30d | 90d | all) - default: 30d
 */
stats.get('/', async (c) => {
  try {
    const user = getUser(c);
    if (!user) {
      return c.json({ success: false, error: { code: 'UNAUTHORIZED', message: apiMessage(c, "unauthorized") } }, 401);
    }

    const range = (c.req.query('range') || '30d') as TimeRange;
    const validRanges: TimeRange[] = ['7d', '30d', '90d', 'all'];

    if (!validRanges.includes(range)) {
      return c.json({ success: false, error: { code: 'BAD_REQUEST', message: apiMessage(c, "badRequest") } }, 400);
    }

    const db = createDb(c.env.DB);
    const statsData = await getUserStats(user.id, range, db);

    return c.json({
      success: true,
      data: statsData,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return c.json({ success: false, error: { code: 'INTERNAL_ERROR', message: apiMessage(c, "internalError") } }, 500);
  }
});

export default stats;

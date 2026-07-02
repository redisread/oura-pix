/**
 * Stats Routes
 *
 * API endpoints for generation statistics
 */

import { getUserStats, type TimeRange } from '../services/statsService';
import { createRouter, useCtx } from '../lib/route';
import { badRequest } from '../lib/http';

const stats = createRouter();

/**
 * GET /api/stats
 * Get user generation statistics
 *
 * Query params:
 * - range: TimeRange (7d | 30d | 90d | all) - default: 30d
 */
stats.get('/', async (c) => {
  const { user, db } = useCtx(c);

  const range = (c.req.query('range') || '30d') as TimeRange;
  const validRanges: TimeRange[] = ['7d', '30d', '90d', 'all'];
  if (!validRanges.includes(range)) return badRequest(c);

  const statsData = await getUserStats(user.id, range, db);

  return c.json({
    success: true,
    data: statsData,
  });
});

export default stats;

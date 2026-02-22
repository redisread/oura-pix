/**
 * Rate Limiting Configuration
 * Provides rate limiting for API endpoints and user actions
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Key prefix for storage
}

/**
 * Rate limit store entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory store for rate limiting
 * In production, use Redis or similar distributed store
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Default rate limit configurations
 */
export const RATE_LIMITS = {
  // General API endpoints
  API_DEFAULT: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },
  // AI generation endpoints
  AI_GENERATION: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // Authentication endpoints
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  },
  // File upload endpoints
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  // Webhook endpoints (higher limit)
  WEBHOOK: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
} as const;

/**
 * Rate limit result
 */
export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Generate rate limit key from request
 * @param request - Next.js request
 * @param identifier - Additional identifier (e.g., user ID)
 * @returns Rate limit key
 */
export function generateRateLimitKey(
  request: NextRequest,
  identifier?: string
): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    'unknown';

  const path = request.nextUrl.pathname;

  if (identifier) {
    return `${path}:${identifier}`;
  }

  return `${path}:${ip}`;
}

/**
 * Check rate limit
 * @param key - Rate limit key
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(windowStart);
  }

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime <= now) {
    // First request or window expired
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, newEntry);

    return {
      allowed: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime: newEntry.resetTime,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

    return {
      allowed: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Clean up expired rate limit entries
 * @param windowStart - Window start time
 */
function cleanupExpiredEntries(windowStart: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= windowStart) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limit middleware for API routes
 * @param request - Next.js request
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null otherwise
 */
export function rateLimitMiddleware(
  request: NextRequest,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
): NextResponse | null {
  const key = generateRateLimitKey(request);
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return createRateLimitResponse(result);
  }

  return null;
}

/**
 * Create rate limit response with headers
 * @param result - Rate limit result
 * @returns Next.js response
 */
function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const headers = new Headers({
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  });

  if (result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }

  return NextResponse.json(
    {
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: result.retryAfter,
    },
    {
      status: 429,
      headers,
    }
  );
}

/**
 * Higher-order function for rate limiting API handlers
 * @param handler - API handler function
 * @param config - Rate limit configuration
 * @returns Wrapped handler with rate limiting
 */
export function withRateLimit<T extends (req: NextRequest) => Promise<NextResponse>>(
  handler: T,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
): (req: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResponse = rateLimitMiddleware(request, config);

    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    return handler(request);
  };
}

/**
 * Rate limit by user ID (for authenticated requests)
 * @param request - Next.js request
 * @param userId - User ID
 * @param config - Rate limit configuration
 * @returns Response if rate limited, null otherwise
 */
export function rateLimitByUser(
  request: NextRequest,
  userId: string,
  config: RateLimitConfig = RATE_LIMITS.API_DEFAULT
): NextResponse | null {
  const key = generateRateLimitKey(request, userId);
  const result = checkRateLimit(key, config);

  if (!result.allowed) {
    return createRateLimitResponse(result);
  }

  return null;
}

/**
 * Sliding window rate limit (more accurate but computationally heavier)
 * For production with Redis, use this implementation
 */
export class SlidingWindowRateLimiter {
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed (to be implemented with Redis)
   * @param key - Rate limit key
   * @returns Rate limit result
   */
  async check(key: string): Promise<RateLimitResult> {
    // This is a placeholder for Redis implementation
    // In production, use Redis sorted sets for sliding window
    const now = Date.now();

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - 1,
      resetTime: now + this.windowMs,
    };
  }
}

/**
 * Rate limit configuration for different user tiers
 */
export const TIER_RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  starter: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  },
  pro: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  },
  enterprise: {
    windowMs: 60 * 1000,
    maxRequests: 500,
  },
};

/**
 * Get rate limit config for user tier
 * @param tier - User subscription tier
 * @returns Rate limit configuration
 */
export function getTierRateLimit(tier: string): RateLimitConfig {
  return TIER_RATE_LIMITS[tier.toLowerCase()] || TIER_RATE_LIMITS.free;
}

/**
 * Reset rate limit for a key
 * @param key - Rate limit key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status
 * @param key - Rate limit key
 * @param config - Rate limit configuration
 * @returns Current rate limit status
 */
export function getRateLimitStatus(
  key: string,
  config: RateLimitConfig
): Omit<RateLimitResult, 'allowed' | 'retryAfter'> {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime <= now) {
    return {
      limit: config.maxRequests,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  return {
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.resetTime,
  };
}

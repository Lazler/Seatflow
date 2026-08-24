// Simple in-memory rate limiter (single-instance; swap for Redis/Upstash in multi-instance deployments)
const counters = new Map<string, { count: number; reset: number }>();

/**
 * Returns true if the request should be blocked (rate limit exceeded).
 * @param key    Unique identifier (e.g. "checkout:1.2.3.4")
 * @param limit  Max requests per window
 * @param windowSec  Window size in seconds
 */
export function rateLimit(key: string, limit: number, windowSec: number): boolean {
  const now = Date.now();
  const entry = counters.get(key);

  if (!entry || now > entry.reset) {
    counters.set(key, { count: 1, reset: now + windowSec * 1000 });
    return false;
  }

  entry.count++;
  if (entry.count > limit) return true;
  return false;
}

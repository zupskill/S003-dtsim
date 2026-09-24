import { Request, Response, NextFunction } from "express";

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyPrefix?: string;
}

// In-memory sliding-window store
const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale records every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < 120000);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export function getClientIdentifier(req: Request): string {
  // 1. Identity is based on verified user ID where authentication exists
  const authenticatedUserId = (req as any).userId || (req as any).user?.id;
  if (authenticatedUserId && typeof authenticatedUserId === "string") {
    return `user:${authenticatedUserId}`;
  }

  // 2. Unauthenticated requests use client IP limiting (with X-Forwarded-For reverse proxy support)
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    const ips = forwarded.split(",");
    const clientIp = ips[0].trim();
    if (clientIp) return `ip:${clientIp}`;
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    const clientIp = forwarded[0].trim();
    if (clientIp) return `ip:${clientIp}`;
  }

  // Fallback to socket remote address
  const remote = req.socket?.remoteAddress || req.ip || "unknown-ip";
  return `ip:${remote}`;
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, maxRequests, message, keyPrefix = "rl" } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const clientId = getClientIdentifier(req);
    const key = `${keyPrefix}:${clientId}`;
    const now = Date.now();

    let record = rateLimitStore.get(key);
    if (!record) {
      record = { timestamps: [] };
      rateLimitStore.set(key, record);
    }

    // Filter out timestamps outside sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", String(Math.ceil((oldest + windowMs) / 1000)));

      res.status(429).json({
        error: message || "Too many requests. Please slow down and try again.",
        retryAfter: retryAfterSec,
      });
      return;
    }

    record.timestamps.push(now);
    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    next();
  };
}

// Strict limiter for expensive AI endpoints (30 req / min)
export const strictAiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  keyPrefix: "ai",
  message: "AI evaluation rate limit reached. Please wait a moment before trying again.",
});

// Very strict limiter for full evaluation / thoughtfulness scoring (10 req / min)
export const scoringLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyPrefix: "score",
  message: "Scoring evaluation rate limit reached. Please wait before submitting again.",
});

// Moderate limiter for general API reads and lightweight operations (120 req / min)
export const moderateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  keyPrefix: "gen",
  message: "Request limit exceeded. Please wait a moment.",
});

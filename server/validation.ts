import { Request, Response, NextFunction } from "express";

export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-XSS-Protection", "0");
  // For API endpoints, prevent aggressive browser caching
  if (req.path.startsWith("/api/")) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
}

/**
 * Sanitize a string:
 * - Truncate to maxLength (default 2000)
 * - Strip null bytes and non-printable control characters (except newline, tab)
 * - Trim whitespace
 */
export function sanitizeString(val: any, maxLength = 2000): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  // Strip control characters (\x00-\x08, \x0B, \x0C, \x0E-\x1F, \x7F)
  const cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned.trim().slice(0, maxLength);
}

/**
 * Validate and sanitize an array of strings:
 * - Max items limit
 * - Max item length
 */
export function sanitizeStringArray(val: any, maxItems = 30, maxItemLength = 1000): string[] {
  if (!Array.isArray(val)) return [];
  return val
    .slice(0, maxItems)
    .map((item) => sanitizeString(item, maxItemLength))
    .filter((item) => item.length > 0);
}

/**
 * Ensure a payload is an object
 */
export function isPlainObject(val: any): boolean {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

/**
 * Bounded numeric clamp
 */
export function clampNumber(val: any, min: number, max: number, defaultVal = 0): number {
  const num = typeof val === "number" ? val : parseFloat(val);
  if (isNaN(num)) return defaultVal;
  return Math.max(min, Math.min(max, Math.round(num)));
}

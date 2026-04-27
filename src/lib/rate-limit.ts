import { NextRequest, NextResponse } from "next/server";

const rateLimitMap = new Map<string, { count: number, lastRequest: number }>();

export type RateLimitConfig = {
  key?: string;
  namespace?: string;
  limit: number;
  windowMs: number;
};

/**
 * Low-level rate limit check.
 */
export function checkRateLimit(config: RateLimitConfig) {
  const { key, namespace, limit, windowMs } = config;
  const identifier = namespace ? `${namespace}:${key}` : (key || "global");
  
  const now = Date.now();
  const userData = rateLimitMap.get(identifier);

  if (!userData) {
    rateLimitMap.set(identifier, { count: 1, lastRequest: now });
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  // Reset window if time passed
  if (now - userData.lastRequest > windowMs) {
    userData.count = 1;
    userData.lastRequest = now;
    return { allowed: true, remaining: limit - 1, retryAfterSec: 0 };
  }

  if (userData.count >= limit) {
    const retryAfterSec = Math.ceil((windowMs - (now - userData.lastRequest)) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec };
  }

  userData.count += 1;
  return { allowed: true, remaining: limit - userData.count, retryAfterSec: 0 };
}

/**
 * Helper to enforce rate limit in Next.js API routes.
 */
export function enforceRateLimit(request: NextRequest, config: Omit<RateLimitConfig, "key">) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const result = checkRateLimit({ ...config, key: ip });

  if (!result.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later.", retryAfter: result.retryAfterSec },
      { 
        status: 429,
        headers: {
          "Retry-After": result.retryAfterSec.toString()
        }
      }
    );
  }

  return null;
}

/**
 * Alias for the simpler version if needed.
 */
export function rateLimit(identifier: string, limit: number = 5, windowMs: number = 60000) {
  const result = checkRateLimit({ key: identifier, limit, windowMs });
  return { success: result.allowed, remaining: result.remaining };
}

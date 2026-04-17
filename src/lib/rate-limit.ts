import { NextRequest, NextResponse } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export function checkRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const bucket = buckets.get(input.key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return { allowed: true, retryAfterSec: Math.ceil(input.windowMs / 1000) };
  }

  bucket.count += 1;
  buckets.set(input.key, bucket);

  if (bucket.count > input.limit) {
    return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  }

  return { allowed: true, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
}

export function enforceRateLimit(request: NextRequest, input: {
  namespace: string;
  limit: number;
  windowMs: number;
}) {
  const ip = getClientIp(request);
  const key = `${input.namespace}:${ip}`;
  const result = checkRateLimit({ key, limit: input.limit, windowMs: input.windowMs });
  if (result.allowed) return null;

  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSec),
      },
    }
  );
}


import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";

const handlers = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  const limited = enforceRateLimit(request, { namespace: "auth:get", limit: 120, windowMs: 60_000 });
  if (limited) return limited;
  return handlers.GET(request);
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, { namespace: "auth:post", limit: 40, windowMs: 60_000 });
  if (limited) return limited;
  return handlers.POST(request);
}

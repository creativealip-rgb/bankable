import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  const limited = enforceRateLimit(req, { namespace: "auth:get", limit: 100, windowMs: 60000 });
  if (limited) return limited;
  
  return handler.GET(req);
}

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { namespace: "auth:post", limit: 10, windowMs: 60000 });
  if (limited) return limited;

  return handler.POST(req);
}

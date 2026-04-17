import crypto from "crypto";
import { db } from "@/db";
import { adminAuditLogs } from "@/db/schema";

export async function writeAdminAudit(input: {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(adminAuditLogs).values({
    id: crypto.randomUUID(),
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId || null,
    metadata: input.metadata || null,
  });
}


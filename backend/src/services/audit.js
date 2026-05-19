import { AuditLog } from "../models/index.js";

export async function writeAudit(req, { action, entityType = null, entityId = null, metadata = {} }) {
  try {
    await AuditLog.create({
      ActorId: req.user?.id || metadata.actorId || null,
      actorEmail: req.user?.email || metadata.email || null,
      actorRole: req.user?.role || metadata.role || "anonymous",
      action,
      entityType,
      entityId,
      metadata,
      ipAddress: req.ip || null,
      userAgent: req.get?.("user-agent")?.slice(0, 300) || null
    });
  } catch (error) {
    console.warn(`Audit log netrimis: ${error.message}`);
  }
}

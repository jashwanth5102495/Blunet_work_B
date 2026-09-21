import { db } from '../config/db.js';

export const logAudit = async (
  userId: string | undefined,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: any,
  ipAddress?: string
) => {
  try {
    await db.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entity,
        entityId: entityId || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
  }
};

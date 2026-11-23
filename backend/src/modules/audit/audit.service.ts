import { prisma } from '../../config/prisma.js';

export class AuditService {
  static async log(params: {
    userId?: string;
    actorType: 'USER' | 'AI_AGENT' | 'SYSTEM';
    action: string;
    entityType: 'ACCOUNT' | 'TRANSACTION' | 'AGENT_ACTION' | 'CARD' | 'USER' | 'TRANSFER' | 'BUDGET';
    entityId?: string;
    details: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      return await prisma.auditLog.create({
        data: {
          userId: params.userId,
          actorType: params.actorType,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          details: JSON.stringify(params.details),
          ipAddress: params.ipAddress || '127.0.0.1',
          userAgent: params.userAgent || 'FinPilot Mobile Core',
        },
      });
    } catch (err) {
      console.error('[AuditService] Failed to record audit log:', err);
      return null;
    }
  }

  static async getLogs(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

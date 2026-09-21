import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db.js';

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action, entity, page = 1, limit = 50, org } = req.query;

    const pageNum = parseInt(String(page), 10);
    const limitNum = parseInt(String(limit), 10);
    const skip = (pageNum - 1) * limitNum;

    const targetOrg = org ? String(org).toUpperCase() : 'BLUNET';

    const where: any = {
      user: {
        organization: targetOrg,
      },
    };
    if (action) where.action = String(action);
    if (entity) where.entity = String(entity);

    const [total, logs] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, employeeId: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

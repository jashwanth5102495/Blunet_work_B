import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { logAudit } from '../../utils/audit.js';

export const getTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(String(req.query.month), 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : now.getFullYear();

    let target = await db.marketingTarget.findUnique({
      where: { month_year: { month, year } },
    });

    if (!target) {
      target = {
        id: 'default',
        month,
        year,
        targetLeads: 500,
        targetCalls: 200,
        targetDeals: 20,
        targetRevenue: 1000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    res.status(200).json({
      success: true,
      data: target,
    });
  } catch (err) {
    next(err);
  }
};

export const setTarget = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { month, year, targetLeads, targetCalls, targetDeals, targetRevenue } = req.body;
    const userId = req.user?.userId;

    if (!month || !year || targetLeads === undefined || targetRevenue === undefined) {
      throw new AppError('Month, year, target leads, and target revenue are required.', 400, 'MISSING_FIELDS');
    }

    const target = await db.marketingTarget.upsert({
      where: { month_year: { month: parseInt(month, 10), year: parseInt(year, 10) } },
      update: {
        targetLeads: parseInt(targetLeads, 10),
        targetCalls: parseInt(targetCalls || '0', 10),
        targetDeals: parseInt(targetDeals || '0', 10),
        targetRevenue: parseFloat(targetRevenue),
      },
      create: {
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        targetLeads: parseInt(targetLeads, 10),
        targetCalls: parseInt(targetCalls || '0', 10),
        targetDeals: parseInt(targetDeals || '0', 10),
        targetRevenue: parseFloat(targetRevenue),
      },
    });

    await logAudit(userId, 'TARGET_UPDATED', 'MarketingTarget', target.id, { month, year, targetRevenue }, req.ip);

    res.status(200).json({
      success: true,
      data: target,
      message: 'Marketing target saved successfully.',
    });
  } catch (err) {
    next(err);
  }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const month = req.query.month ? parseInt(String(req.query.month), 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : now.getFullYear();

    let target = await db.marketingTarget.findUnique({
      where: { month_year: { month, year } },
    });
    if (!target) {
      target = {
        id: 'default',
        month,
        year,
        targetLeads: 500,
        targetCalls: 200,
        targetDeals: 20,
        targetRevenue: 1000000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // Real database calculations
    const [
      totalLeads,
      completedCalls,
      interestedLeads,
      notInterestedLeads,
      followUpLeads,
      closedDeals,
      dealValueAggregate,
    ] = await Promise.all([
      db.lead.count(),
      db.leadResponse.count(),
      db.lead.count({ where: { outcome: 'INTERESTED' } }),
      db.lead.count({ where: { outcome: 'NOT_INTERESTED' } }),
      db.lead.count({ where: { outcome: 'FOLLOW_UP_REQUIRED' } }),
      db.lead.count({ where: { outcome: 'CLOSED' } }),
      db.leadResponse.aggregate({ _sum: { dealValue: true } }),
    ]);

    const achievedRevenue = dealValueAggregate._sum.dealValue || 0;
    const progressPercentage = target.targetRevenue > 0
      ? Math.min(100, Math.round((achievedRevenue / target.targetRevenue) * 100))
      : 0;

    const statusBreakdown = [
      { status: 'INTERESTED', count: interestedLeads },
      { status: 'FOLLOW_UP_REQUIRED', count: followUpLeads },
      { status: 'NOT_INTERESTED', count: notInterestedLeads },
      { status: 'CLOSED', count: closedDeals },
    ];

    res.status(200).json({
      success: true,
      data: {
        target: {
          month,
          year,
          targetLeads: target.targetLeads,
          targetCalls: target.targetCalls,
          targetDeals: target.targetDeals,
          targetRevenue: target.targetRevenue,
        },
        achieved: {
          totalLeads,
          completedCalls,
          interestedLeads,
          followUpLeads,
          closedDeals,
          revenue: achievedRevenue,
          progressPercentage,
        },
        statusBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

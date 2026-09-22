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

export const getTeamSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { org } = req.query;
    const targetOrg = org ? String(org).toUpperCase() : 'BLUNET';

    const members = await db.user.findMany({
      where: {
        role: 'MARKETING_HEAD',
        organization: targetOrg,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        organization: true,
        isActive: true,
      },
      orderBy: { employeeId: 'asc' },
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const summaryList = await Promise.all(
      members.map(async (member) => {
        const todayCalls = await db.leadResponse.count({
          where: {
            userId: member.id,
            createdAt: { gte: startOfToday, lte: endOfToday },
          },
        });

        const monthlyDeals = await db.deal.count({
          where: {
            marketingPersonId: member.id,
            status: 'WON',
            closedAt: { gte: startOfMonth, lte: endOfMonth },
          },
        });

        const targetConfig = await db.employeeTarget.findUnique({
          where: { employeeId_month_year: { employeeId: member.id, month: currentMonth, year: currentYear } },
        });

        const dailyLeadTarget = targetConfig?.dailyLeadTarget || 20;
        const monthlyDealTarget = targetConfig?.monthlyDealTarget || 7;

        const assignedLeads = await db.lead.count({
          where: {
            OR: [
              { assignedToId: member.id },
              { responses: { some: { userId: member.id } } },
            ],
          },
        });

        const dailyProgress = dailyLeadTarget > 0 ? Math.min(100, Math.round((todayCalls / dailyLeadTarget) * 100)) : 0;
        const dealProgress = monthlyDealTarget > 0 ? Math.min(100, Math.round((monthlyDeals / monthlyDealTarget) * 100)) : 0;

        return {
          ...member,
          todayCalls,
          dailyLeadTarget,
          monthlyDeals,
          monthlyDealTarget,
          assignedLeads,
          dailyProgress,
          dealProgress,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: summaryList,
    });
  } catch (err) {
    next(err);
  }
};

export const getEmployeePerformance = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetEmployeeId = String(req.params.employeeId);
    const now = new Date();
    const month = req.query.month ? parseInt(String(req.query.month), 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : now.getFullYear();

    const employee = await db.user.findFirst({
      where: {
        OR: [{ id: targetEmployeeId }, { employeeId: targetEmployeeId }],
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        organization: true,
        joiningDate: true,
        isActive: true,
      },
    });

    if (!employee) {
      throw new AppError('Marketing employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const targetConfig = await db.employeeTarget.findUnique({
      where: { employeeId_month_year: { employeeId: employee.id, month, year } },
    });

    const dailyLeadTarget = targetConfig?.dailyLeadTarget || 20;
    const monthlyDealTarget = targetConfig?.monthlyDealTarget || 7;

    const [
      todayCalls,
      monthCalls,
      monthDeals,
      assignedLeads,
      outcomesRaw,
      closedDealsList,
    ] = await Promise.all([
      db.leadResponse.count({
        where: {
          userId: employee.id,
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      db.leadResponse.count({
        where: {
          userId: employee.id,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      db.deal.count({
        where: {
          marketingPersonId: employee.id,
          status: 'WON',
          closedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
      db.lead.count({
        where: {
          OR: [
            { assignedToId: employee.id },
            { responses: { some: { userId: employee.id } } },
          ],
        },
      }),
      db.leadResponse.groupBy({
        by: ['outcome'],
        where: {
          userId: employee.id,
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _count: { outcome: true },
      }),
      db.deal.findMany({
        where: {
          marketingPersonId: employee.id,
          closedAt: { gte: startOfMonth, lte: endOfMonth },
        },
        orderBy: { closedAt: 'desc' },
        select: {
          id: true,
          projectName: true,
          status: true,
          value: true,
          closedAt: true,
        },
      }),
    ]);

    const leadOutcomes = outcomesRaw.map((o) => ({
      outcome: o.outcome,
      count: o._count.outcome,
    }));

    const conversionRate = monthCalls > 0 ? parseFloat(((monthDeals / monthCalls) * 100).toFixed(2)) : 0;

    res.status(200).json({
      success: true,
      data: {
        employee,
        period: { month, year },
        targets: {
          dailyLeadTarget,
          monthlyDealTarget,
        },
        today: {
          callsCompleted: todayCalls,
          callTarget: dailyLeadTarget,
          remainingCalls: Math.max(0, dailyLeadTarget - todayCalls),
          progressPercentage: dailyLeadTarget > 0 ? Math.min(100, Math.round((todayCalls / dailyLeadTarget) * 100)) : 0,
          isCompleted: todayCalls >= dailyLeadTarget,
        },
        month: {
          leadsAssigned: assignedLeads,
          callsCompleted: monthCalls,
          dealsClosed: monthDeals,
          dealTarget: monthlyDealTarget,
          remainingDeals: Math.max(0, monthlyDealTarget - monthDeals),
          progressPercentage: monthlyDealTarget > 0 ? Math.min(100, Math.round((monthDeals / monthlyDealTarget) * 100)) : 0,
          isAchieved: monthDeals >= monthlyDealTarget,
          conversionRate,
        },
        leadOutcomes,
        closedDeals: closedDealsList,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getEmployeeTargets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetEmpId = String(req.params.employeeId);
    const now = new Date();
    const month = req.query.month ? parseInt(String(req.query.month), 10) : now.getMonth() + 1;
    const year = req.query.year ? parseInt(String(req.query.year), 10) : now.getFullYear();

    const emp = await db.user.findFirst({
      where: { OR: [{ id: targetEmpId }, { employeeId: targetEmpId }] },
    });

    if (!emp) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    let target = await db.employeeTarget.findUnique({
      where: { employeeId_month_year: { employeeId: emp.id, month, year } },
    });

    if (!target) {
      target = {
        id: 'default',
        employeeId: emp.id,
        month,
        year,
        dailyLeadTarget: 20,
        monthlyDealTarget: 7,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    res.status(200).json({ success: true, data: target });
  } catch (err) {
    next(err);
  }
};

export const updateEmployeeTargets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const targetEmpId = String(req.params.employeeId);
    const { month, year, dailyLeadTarget, monthlyDealTarget } = req.body;
    const userId = req.user?.userId;

    const emp = await db.user.findFirst({
      where: { OR: [{ id: targetEmpId }, { employeeId: targetEmpId }] },
    });

    if (!emp) {
      throw new AppError('Employee not found.', 404, 'EMPLOYEE_NOT_FOUND');
    }

    const now = new Date();
    const targetMonth = month ? parseInt(String(month), 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(String(year), 10) : now.getFullYear();

    const updatedTarget = await db.employeeTarget.upsert({
      where: { employeeId_month_year: { employeeId: emp.id, month: targetMonth, year: targetYear } },
      update: {
        dailyLeadTarget: parseInt(String(dailyLeadTarget || 20), 10),
        monthlyDealTarget: parseInt(String(monthlyDealTarget || 7), 10),
      },
      create: {
        employeeId: emp.id,
        month: targetMonth,
        year: targetYear,
        dailyLeadTarget: parseInt(String(dailyLeadTarget || 20), 10),
        monthlyDealTarget: parseInt(String(monthlyDealTarget || 7), 10),
      },
    });

    await logAudit(userId, 'EMPLOYEE_TARGET_UPDATED', 'EmployeeTarget', updatedTarget.id, { employeeId: emp.id, month: targetMonth, year: targetYear }, req.ip);

    res.status(200).json({
      success: true,
      data: updatedTarget,
      message: `Targets updated for ${emp.name}: ${updatedTarget.dailyLeadTarget} calls/day, ${updatedTarget.monthlyDealTarget} deals/month.`,
    });
  } catch (err) {
    next(err);
  }
};

export const getTeamPerformanceOverview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = 'this_month', org } = req.query;
    const targetOrg = org ? String(org).toUpperCase() : 'BLUNET';

    const members = await db.user.findMany({
      where: {
        role: 'MARKETING_HEAD',
        organization: targetOrg,
      },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        designation: true,
        organization: true,
        isActive: true,
      },
      orderBy: { employeeId: 'asc' },
    });

    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (period === 'today') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.setDate(diff));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'prev_month') {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
      startDate = new Date(prevYear, prevMonth - 1, 1);
      endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    }

    let teamCallsCompleted = 0;
    let teamCallTarget = 0;
    let teamDealsClosed = 0;
    let teamDealTarget = 0;

    const memberBreakdown = await Promise.all(
      members.map(async (member) => {
        const callsCompleted = await db.leadResponse.count({
          where: {
            userId: member.id,
            createdAt: { gte: startDate, lte: endDate },
          },
        });

        const dealsClosed = await db.deal.count({
          where: {
            marketingPersonId: member.id,
            status: 'WON',
            closedAt: { gte: startDate, lte: endDate },
          },
        });

        const targetConfig = await db.employeeTarget.findUnique({
          where: { employeeId_month_year: { employeeId: member.id, month: currentMonth, year: currentYear } },
        });

        const dailyLeadTarget = targetConfig?.dailyLeadTarget || 20;
        const monthlyDealTarget = targetConfig?.monthlyDealTarget || 7;

        let memberCallTarget = dailyLeadTarget;
        if (period === 'this_month' || period === 'prev_month') {
          memberCallTarget = dailyLeadTarget * 20;
        } else if (period === 'this_week') {
          memberCallTarget = dailyLeadTarget * 5;
        }

        teamCallsCompleted += callsCompleted;
        teamCallTarget += memberCallTarget;
        teamDealsClosed += dealsClosed;
        teamDealTarget += monthlyDealTarget;

        const callProgress = memberCallTarget > 0 ? parseFloat(((callsCompleted / memberCallTarget) * 100).toFixed(1)) : 0;
        const dealProgress = monthlyDealTarget > 0 ? parseFloat(((dealsClosed / monthlyDealTarget) * 100).toFixed(1)) : 0;

        return {
          ...member,
          callsCompleted,
          callTarget: memberCallTarget,
          callProgress,
          dealsClosed,
          dealTarget: monthlyDealTarget,
          dealProgress,
        };
      })
    );

    const teamCallProgress = teamCallTarget > 0 ? parseFloat(((teamCallsCompleted / teamCallTarget) * 100).toFixed(1)) : 0;
    const teamDealProgress = teamDealTarget > 0 ? parseFloat(((teamDealsClosed / teamDealTarget) * 100).toFixed(1)) : 0;
    const dealsAboveTarget = Math.max(0, teamDealsClosed - teamDealTarget);

    res.status(200).json({
      success: true,
      data: {
        period: String(period),
        team: {
          totalMembers: members.length,
          callsCompleted: teamCallsCompleted,
          callTarget: teamCallTarget,
          callProgress: teamCallProgress,
          dealsClosed: teamDealsClosed,
          dealTarget: teamDealTarget,
          dealProgress: teamDealProgress,
          dealsAboveTarget,
          isDealTargetAchieved: teamDealsClosed >= teamDealTarget,
        },
        members: memberBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getEmployeeReminders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AppError('Unauthenticated.', 401, 'UNAUTHORIZED');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const targetConfig = await db.employeeTarget.findUnique({
      where: { employeeId_month_year: { employeeId: userId, month: currentMonth, year: currentYear } },
    });

    const dailyLeadTarget = targetConfig?.dailyLeadTarget || 20;
    const monthlyDealTarget = targetConfig?.monthlyDealTarget || 7;

    const [todayCalls, monthDeals] = await Promise.all([
      db.leadResponse.count({
        where: {
          userId,
          createdAt: { gte: startOfToday, lte: endOfToday },
        },
      }),
      db.deal.count({
        where: {
          marketingPersonId: userId,
          status: 'WON',
          closedAt: { gte: startOfMonth, lte: endOfMonth },
        },
      }),
    ]);

    const currentHour = now.getHours();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const currentDayOfMonth = now.getDate();

    const callsRemaining = Math.max(0, dailyLeadTarget - todayCalls);
    const isDailyBehind = todayCalls < dailyLeadTarget && (currentHour >= 14 || todayCalls < Math.floor(dailyLeadTarget / 2));

    const dealsRemaining = Math.max(0, monthlyDealTarget - monthDeals);
    const isMonthlyBehind = monthDeals < monthlyDealTarget && (currentDayOfMonth >= Math.floor(daysInMonth / 2) || monthDeals === 0);

    const isBehind = isDailyBehind || isMonthlyBehind;

    res.status(200).json({
      success: true,
      data: {
        isBehind,
        daily: {
          isBehind: isDailyBehind,
          completedCalls: todayCalls,
          dailyTarget: dailyLeadTarget,
          remainingCalls: callsRemaining,
          progressPercentage: dailyLeadTarget > 0 ? Math.min(100, Math.round((todayCalls / dailyLeadTarget) * 100)) : 0,
        },
        monthly: {
          isBehind: isMonthlyBehind,
          dealsClosed: monthDeals,
          monthlyTarget: monthlyDealTarget,
          remainingDeals: dealsRemaining,
          progressPercentage: monthlyDealTarget > 0 ? Math.min(100, Math.round((monthDeals / monthlyDealTarget) * 100)) : 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

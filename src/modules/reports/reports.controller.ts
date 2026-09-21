import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db.js';

export const getCompanyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [
      totalEmployees,
      activeEmployees,
      totalTasks,
      completedTasks,
      overdueTasks,
      totalLeads,
      totalCalls,
      interestedLeads,
      closedDeals,
      dealValueAgg,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { isActive: true } }),
      db.task.count(),
      db.task.count({ where: { status: 'COMPLETED' } }),
      db.task.count({ where: { status: 'OVERDUE' } }),
      db.lead.count(),
      db.leadResponse.count(),
      db.lead.count({ where: { outcome: 'INTERESTED' } }),
      db.lead.count({ where: { outcome: 'CLOSED' } }),
      db.leadResponse.aggregate({ _sum: { dealValue: true } }),
    ]);

    const revenue = dealValueAgg._sum.dealValue || 0;

    const taskCompletionRate = totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

    const now = new Date();
    const target = await db.marketingTarget.findUnique({
      where: { month_year: { month: now.getMonth() + 1, year: now.getFullYear() } },
    });

    const targetRevenue = target?.targetRevenue || 1000000;
    const targetAchievement = targetRevenue > 0
      ? Math.min(100, Math.round((revenue / targetRevenue) * 100))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          overdue: overdueTasks,
          completionRate: taskCompletionRate,
        },
        marketing: {
          totalLeads,
          totalCalls,
          interestedLeads,
          closedDeals,
          revenue,
          targetRevenue,
          targetAchievement,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getAdminOverviewReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const targetOrg = req.query.org ? String(req.query.org).toUpperCase() : 'BLUNET';

    const [
      totalEmployees,
      activeEmployees,
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      totalLeads,
      totalCalls,
      interestedLeads,
      followUpLeads,
      notInterestedLeads,
      closedDeals,
      dealValueAgg,
      target,
      employeeWorkloadData,
    ] = await Promise.all([
      db.user.count({ where: { organization: targetOrg } }),
      db.user.count({ where: { organization: targetOrg, isActive: true } }),
      db.task.count(),
      db.task.count({ where: { status: 'COMPLETED' } }),
      db.task.count({ where: { status: 'IN_PROGRESS' } }),
      db.task.count({ where: { status: 'TODO' } }),
      db.lead.count(),
      db.leadResponse.count(),
      db.lead.count({ where: { outcome: 'INTERESTED' } }),
      db.lead.count({ where: { outcome: 'FOLLOW_UP_REQUIRED' } }),
      db.lead.count({ where: { outcome: 'NOT_INTERESTED' } }),
      db.lead.count({ where: { outcome: 'CLOSED' } }),
      db.leadResponse.aggregate({ _sum: { dealValue: true } }),
      db.marketingTarget.findUnique({
        where: { month_year: { month: currentMonth, year: currentYear } },
      }),
      db.user.findMany({
        where: { organization: targetOrg },
        select: {
          id: true,
          name: true,
          employeeId: true,
          role: true,
          designation: true,
          _count: {
            select: {
              assignedTasks: true,
            },
          },
        },
      }),
    ]);

    const revenue = dealValueAgg._sum.dealValue || 0;
    const targetRevenue = target?.targetRevenue || 1000000;
    const targetLeads = target?.targetLeads || 500;
    const progressPercent = targetRevenue > 0
      ? Math.min(100, Math.round((revenue / targetRevenue) * 100))
      : 0;

    const taskDistribution = [
      { name: 'To Do', count: todoTasks, fill: '#64748B' },
      { name: 'In Progress', count: inProgressTasks, fill: '#2563EB' },
      { name: 'Completed', count: completedTasks, fill: '#16A34A' },
    ];

    const leadFunnel = [
      { name: 'Interested', count: interestedLeads, fill: '#2563EB' },
      { name: 'Follow-Up', count: followUpLeads, fill: '#D97706' },
      { name: 'Not Interested', count: notInterestedLeads, fill: '#DC2626' },
      { name: 'Closed Deal', count: closedDeals, fill: '#16A34A' },
    ];

    const employeeWorkload = employeeWorkloadData.map((emp: any) => ({
      name: emp.name,
      employeeId: emp.employeeId,
      designation: emp.designation,
      tasks: emp._count.assignedTasks,
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          totalLeads,
          totalCalls,
          interestedLeads,
          closedDeals,
          revenue,
          targetRevenue,
          targetLeads,
          progressPercent,
        },
        taskDistribution,
        leadFunnel,
        employeeWorkload,
      },
    });
  } catch (err) {
    next(err);
  }
};

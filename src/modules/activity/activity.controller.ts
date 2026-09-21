import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export const heartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { isIdle = false, elapsedSeconds = 60 } = req.body;

    if (!userId) {
      throw new AppError('Unauthenticated user.', 401, 'UNAUTHORIZED');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let session = await db.activitySession.findFirst({
      where: {
        userId,
        loginAt: { gte: todayStart },
        logoutAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    const secondsToAdd = Math.min(Math.max(1, parseInt(String(elapsedSeconds), 10)), 300);

    if (!session) {
      session = await db.activitySession.create({
        data: {
          userId,
          loginAt: new Date(),
          activeSeconds: isIdle ? 0 : secondsToAdd,
          idleSeconds: isIdle ? secondsToAdd : 0,
          lastHeartbeatAt: new Date(),
        },
      });
    } else {
      session = await db.activitySession.update({
        where: { id: session.id },
        data: {
          activeSeconds: isIdle ? session.activeSeconds : session.activeSeconds + secondsToAdd,
          idleSeconds: isIdle ? session.idleSeconds + secondsToAdd : session.idleSeconds,
          lastHeartbeatAt: new Date(),
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        activeSeconds: session.activeSeconds,
        idleSeconds: session.idleSeconds,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getSessionSummary = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError('Unauthenticated user.', 401, 'UNAUTHORIZED');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const sessions = await db.activitySession.findMany({
      where: {
        userId,
        createdAt: { gte: todayStart },
      },
    });

    let totalActiveSeconds = 0;
    let totalIdleSeconds = 0;
    let loginTime: Date | null = null;

    for (const s of sessions) {
      totalActiveSeconds += s.activeSeconds;
      totalIdleSeconds += s.idleSeconds;
      if (!loginTime || new Date(s.loginAt) < loginTime) {
        loginTime = s.loginAt;
      }
    }

    const activeHours = Math.floor(totalActiveSeconds / 3600);
    const activeMins = Math.floor((totalActiveSeconds % 3600) / 60);

    res.status(200).json({
      success: true,
      data: {
        loginTime: loginTime || new Date(),
        activeSeconds: totalActiveSeconds,
        idleSeconds: totalIdleSeconds,
        activeFormatted: `${activeHours}h ${activeMins}m`,
      },
    });
  } catch (err) {
    next(err);
  }
};

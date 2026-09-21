import { Request, Response, NextFunction } from 'express';
import { db } from '../../config/db.js';

export const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const unreadCount = await db.notification.count({
      where: { userId, isRead: false },
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user?.userId;

    await db.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.',
    });
  } catch (err) {
    next(err);
  }
};

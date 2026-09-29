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

export const sendNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { recipientType, userId, title, message } = req.body;

    if (!title || !message) {
      res.status(400).json({ success: false, message: 'Title and message are required.' });
      return;
    }

    if (recipientType === 'SINGLE') {
      if (!userId) {
        res.status(400).json({ success: false, message: 'Recipient employee selection is required.' });
        return;
      }
      await db.notification.create({
        data: {
          userId,
          title,
          message,
        },
      });
      res.status(201).json({
        success: true,
        message: 'Notification sent to selected employee.',
      });
      return;
    }

    // Default or 'ALL': send to all active employees
    const users = await db.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    if (users.length > 0) {
      await db.notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title,
          message,
        })),
      });
    }

    res.status(201).json({
      success: true,
      message: `Notification broadcasted to ${users.length} active employee profiles.`,
    });
  } catch (err) {
    next(err);
  }
};

export const getAllNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const notifications = await db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { name: true, employeeId: true, role: true },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    next(err);
  }
};

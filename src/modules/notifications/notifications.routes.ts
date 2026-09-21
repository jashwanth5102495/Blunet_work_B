import { Router } from 'express';
import { getNotifications, markAsRead } from './notifications.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

export default router;

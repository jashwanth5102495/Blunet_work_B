import { Router } from 'express';
import { getNotifications, markAsRead, sendNotification, getAllNotifications } from './notifications.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', getNotifications);
router.get('/all', getAllNotifications);
router.post('/send', sendNotification);
router.patch('/:id/read', markAsRead);

export default router;

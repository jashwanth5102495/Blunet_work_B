import { Router } from 'express';
import { getTarget, setTarget, getAnalytics } from './marketing.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/targets', requireRole(['MARKETING_HEAD', 'ADMIN', 'FOUNDER']), getTarget);
router.post('/targets', requireRole(['ADMIN']), setTarget);
router.get('/analytics', requireRole(['MARKETING_HEAD', 'ADMIN', 'FOUNDER']), getAnalytics);

export default router;

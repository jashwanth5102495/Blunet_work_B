import { Router } from 'express';
import { getAuditLogs } from './audit.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', requireRole(['ADMIN', 'MARKETING_HEAD']), getAuditLogs);

export default router;

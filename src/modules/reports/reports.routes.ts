import { Router } from 'express';
import { getCompanyReport, getAdminOverviewReport } from './reports.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/company', requireRole(['FOUNDER', 'ADMIN']), getCompanyReport);
router.get('/admin-overview', requireRole(['ADMIN', 'MARKETING_HEAD']), getAdminOverviewReport);

export default router;

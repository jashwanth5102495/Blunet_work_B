import { Router } from 'express';
import {
  getTarget,
  setTarget,
  getAnalytics,
  getTeamSummary,
  getEmployeePerformance,
  getEmployeeTargets,
  updateEmployeeTargets,
  getTeamPerformanceOverview,
  getEmployeeReminders,
} from './marketing.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/targets', requireRole(['MARKETING_HEAD', 'ADMIN', 'FOUNDER']), getTarget);
router.post('/targets', requireRole(['ADMIN']), setTarget);
router.get('/analytics', requireRole(['MARKETING_HEAD', 'ADMIN', 'FOUNDER']), getAnalytics);

router.get('/team', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), getTeamSummary);
router.get('/team/performance', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), getTeamPerformanceOverview);
router.get('/team/:employeeId/performance', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), getEmployeePerformance);
router.get('/team/:employeeId/targets', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), getEmployeeTargets);
router.post('/team/:employeeId/targets', requireRole(['ADMIN']), updateEmployeeTargets);
router.put('/team/:employeeId/targets', requireRole(['ADMIN']), updateEmployeeTargets);

router.get('/reminders', requireRole(['MARKETING_HEAD', 'ADMIN', 'EMPLOYEE']), getEmployeeReminders);

export default router;

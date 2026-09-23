import { Router } from 'express';
import authRoutes from './modules/auth/auth.routes.js';
import employeeRoutes from './modules/employees/employees.routes.js';
import taskRoutes from './modules/tasks/tasks.routes.js';
import resourceRoutes from './modules/resources/resources.routes.js';
import leadRoutes from './modules/leads/leads.routes.js';
import marketingRoutes from './modules/marketing/marketing.routes.js';
import activityRoutes from './modules/activity/activity.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import auditRoutes from './modules/audit/audit.routes.js';
import studyRoutes from './modules/study/study.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/tasks', taskRoutes);
router.use('/resources', resourceRoutes);
router.use('/leads', leadRoutes);
router.use('/marketing', marketingRoutes);
router.use('/activity', activityRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/study', studyRoutes);

export default router;

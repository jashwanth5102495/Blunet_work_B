import { Router } from 'express';
import {
  getCourses,
  getCourseDetails,
  toggleLessonProgress,
  getCodingTasks,
  submitCodingTask,
  getAdminStudyOverview,
} from './study.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/courses', getCourses);
router.get('/courses/:slug', getCourseDetails);
router.post('/toggle-lesson', toggleLessonProgress);

// Monthly Coding Tasks
router.get('/tasks', getCodingTasks);
router.post('/tasks/submit', submitCodingTask);

// Admin Monitoring Overview
router.get('/admin-overview', getAdminStudyOverview);

export default router;

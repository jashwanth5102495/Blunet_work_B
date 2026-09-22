import { Router } from 'express';
import { getMyTasks, getAllTasks, createTask, updateTaskStatus, addTaskComment, deleteTask } from './tasks.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/my', getMyTasks);
router.get('/', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), getAllTasks);
router.post('/', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), createTask);
router.patch('/:id/status', updateTaskStatus);
router.post('/:id/comments', addTaskComment);
router.delete('/:id', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), deleteTask);

export default router;

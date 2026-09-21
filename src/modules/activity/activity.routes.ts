import { Router } from 'express';
import { heartbeat, getSessionSummary } from './activity.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/heartbeat', heartbeat);
router.get('/summary', getSessionSummary);

export default router;

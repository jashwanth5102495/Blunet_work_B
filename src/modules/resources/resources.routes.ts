import { Router } from 'express';
import multer from 'multer';
import { getResources, createResource, downloadResource, getResourceCategories } from './resources.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const router = Router();

router.use(authenticate);

router.get('/categories', getResourceCategories);
router.get('/', getResources);
router.post('/', requireRole(['ADMIN']), upload.single('file'), createResource);
router.get('/:id/download', downloadResource);

export default router;

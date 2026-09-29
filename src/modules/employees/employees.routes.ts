import { Router } from 'express';
import { getEmployees, createEmployee, getEmployeeById, updateEmployee, deleteEmployee, getDepartments, createCoIntern, getNextCoInternIdEndpoint } from './employees.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/departments', getDepartments);
router.get('/next-co-intern-id', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), getNextCoInternIdEndpoint);
router.post('/co-intern', requireRole(['ADMIN']), createCoIntern);
router.get('/', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), getEmployees);
router.post('/', requireRole(['ADMIN']), createEmployee);
router.get('/:id', requireRole(['ADMIN', 'MARKETING_HEAD', 'FOUNDER']), getEmployeeById);
router.patch('/:id', requireRole(['ADMIN']), updateEmployee);
router.delete('/:id', requireRole(['ADMIN']), deleteEmployee);

export default router;

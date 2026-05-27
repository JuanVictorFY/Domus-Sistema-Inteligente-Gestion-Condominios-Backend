import { Router } from 'express';
import { getAllUsers, deleteUser } from '../controllers/user.controller.js';
import { authenticate, checkRole } from '../middlewares/auth.middleware.js';

const router = Router();

// GET /api/admin/users (solo ADMIN)
router.get('/', authenticate, checkRole(['ADMIN']), getAllUsers);

// DELETE /api/admin/users/:id (solo ADMIN)
router.delete('/:id', authenticate, checkRole(['ADMIN']), deleteUser);

export default router;
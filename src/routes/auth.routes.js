import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateBody } from '../middlewares/validate.middleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validateBody(['email', 'password', 'name']), register);

// POST /api/auth/login
router.post('/login', validateBody(['email', 'password']), login);

// GET /api/auth/verify
router.get('/verify', authenticate, (req, res) => {
  res.json({ valid: true, user: { id: req.user.id, role: req.user.role, email: req.user.email } });
});

// POST /api/auth/logout
router.post('/logout', authenticate, (req, res) => {
  res.json({ message: 'Sesión cerrada. Elimina el token del cliente.' });
});

export default router;
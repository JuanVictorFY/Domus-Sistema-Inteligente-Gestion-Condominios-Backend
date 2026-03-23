import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/profile — Obtener perfil del usuario autenticado
router.get('/', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, depto: true, phone: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el perfil.' });
  }
});

// PUT /api/profile — Actualizar datos del perfil
router.put('/', authenticate, async (req, res) => {
  try {
    const { name, phone, depto } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, depto },
      select: { id: true, name: true, email: true, role: true, depto: true, phone: true }
    });
    res.json({ message: 'Perfil actualizado correctamente.', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el perfil.' });
  }
});

// PUT /api/profile/password — Cambiar contraseña
router.put('/password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Se requiere la contraseña actual y la nueva.' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: 'La contraseña actual es incorrecta.' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar la contraseña.' });
  }
});

export default router;

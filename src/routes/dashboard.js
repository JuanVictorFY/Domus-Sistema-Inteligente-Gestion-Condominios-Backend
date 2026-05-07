import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { prisma } from '../config/prisma.js';
import { startOfMonth, endOfMonth } from '../utils/date.js';

const router = express.Router();

// GET /api/dashboard/summary — Resumen rápido para el dashboard del residente
router.get('/summary', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const monthStart = startOfMonth();
    const monthEnd = endOfMonth();

    const [tickets, reservations, notifications, announcements, maintenanceThisMonth] = await Promise.all([
      prisma.ticket.count({ where: { userId, status: { in: ['Pendiente', 'En Proceso'] } } }),
      prisma.reservation.count({ where: { userId, status: 'Aprobada' } }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.announcement.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } }),
      prisma.maintenanceRequest.count({ where: { userId, createdAt: { gte: monthStart, lte: monthEnd } } }),
    ]);

    res.json({ tickets, reservations, notifications, announcements, maintenanceThisMonth });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el resumen del dashboard.' });
  }
});

export default router;

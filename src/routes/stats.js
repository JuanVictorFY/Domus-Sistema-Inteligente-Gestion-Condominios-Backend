import express from 'express';
import { authenticate, checkRole } from "../middlewares/auth.middleware.js";
import { prisma } from '../config/prisma.js';

const router = express.Router();

// GET /api/stats — métricas generales del sistema (solo ADMIN)
router.get('/', authenticate, checkRole(['ADMIN']), async (_req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      totalTickets,
      openTickets,
      totalReservations,
      pendingReservations,
      totalVisitors,
      activePolls,
      totalAnnouncements,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVO' } }),
      prisma.user.count({ where: { status: 'PENDIENTE' } }),
      prisma.ticket.count(),
      prisma.ticket.count({ where: { status: 'Pendiente' } }),
      prisma.reservation.count(),
      prisma.reservation.count({ where: { status: 'Pendiente' } }),
      prisma.visitor.count(),
      prisma.poll.count({ where: { status: 'Activa' } }),
      prisma.announcement.count(),
    ]);

    res.json({
      users: { total: totalUsers, active: activeUsers, pending: pendingUsers },
      tickets: { total: totalTickets, open: openTickets },
      reservations: { total: totalReservations, pending: pendingReservations },
      visitors: { total: totalVisitors },
      polls: { active: activePolls },
      announcements: { total: totalAnnouncements },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// GET /api/stats/me — estadísticas del residente autenticado
router.get('/me', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const [tickets, reservations, notifications, maintenance] = await Promise.all([
      prisma.ticket.count({ where: { userId } }),
      prisma.reservation.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, read: false } }),
      prisma.maintenanceRequest.count({ where: { userId } }),
    ]);
    res.json({ tickets, reservations, unreadNotifications: notifications, maintenanceRequests: maintenance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener estadísticas personales' });
  }
});

export default router;

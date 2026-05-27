import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/reports/monthly — Reporte mensual para admin
router.get('/monthly', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Acceso restringido.' });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [newUsers, newTickets, newReservations, openTickets, resolvedTickets] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.ticket.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.reservation.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.ticket.count({ where: { status: { in: ['ABIERTO', 'EN_PROCESO'] } } }),
      prisma.ticket.count({ where: { status: 'RESUELTO', updatedAt: { gte: startOfMonth } } }),
    ]);

    res.json({
      period: `${now.toLocaleString('es-PE', { month: 'long' })} ${now.getFullYear()}`,
      newUsers,
      newTickets,
      newReservations,
      openTickets,
      resolvedTickets,
      resolutionRate: newTickets > 0 ? ((resolvedTickets / newTickets) * 100).toFixed(1) + '%' : '0%',
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al generar el reporte.' });
  }
});

// GET /api/reports/activity — Actividad por usuario
router.get('/activity', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Acceso restringido.' });

    const users = await prisma.user.findMany({
      where: { role: 'RESIDENTE' },
      include: {
        _count: { select: { tickets: true, reservations: true, visitors: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const activity = users.map((u) => ({
      id: u.id,
      name: u.name,
      depto: u.depto,
      tickets: u._count.tickets,
      reservations: u._count.reservations,
      visitors: u._count.visitors,
    }));

    res.json(activity);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la actividad.' });
  }
});

export default router;

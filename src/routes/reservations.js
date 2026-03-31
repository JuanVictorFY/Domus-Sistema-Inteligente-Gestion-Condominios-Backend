import express from 'express';
import { authenticate } from '../middlewares/auth.middleware.js';
import { prisma } from '../config/prisma.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';

const router = express.Router();

// GET /api/reservations - Obtener reservas (filtrado por rol, paginado)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, areaId } = req.query;
    const { page, limit, skip } = parsePagination(req.query);
    const where = {};

    if (req.user.role === 'RESIDENTE') {
      where.userId = req.user.id;
    }
    if (status) where.status = status;
    if (areaId) where.areaId = parseInt(areaId);

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          area: true,
          user: { select: { id: true, name: true, depto: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.reservation.count({ where })
    ]);

    res.json({ data: reservations, meta: buildMeta(total, page, limit) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar las reservas" });
  }
});

// GET /api/reservations/:id - Detalle de una reserva
router.get('/:id', authenticate, async (req, res) => {
  try {
    const reservation = await prisma.reservation.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { area: true, user: { select: { id: true, name: true, depto: true } } }
    });
    if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (req.user.role === 'RESIDENTE' && reservation.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener la reserva' });
  }
});

// POST /api/reservations - Crear una reserva (solo RESIDENTE)
router.post('/', authenticate, async (req, res) => {
  try {
    const { areaId, date, timeStart, timeEnd } = req.body;
    console.log('[Reservations] POST recibido:', { areaId, date, timeStart, timeEnd, userId: req.user.id });

    // Validar campos requeridos
    if (!areaId || !date || !timeStart || !timeEnd) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    // Verificar que el área existe y está activa
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    console.log('[Reservations] Área encontrada:', area);
    if (!area) {
      return res.status(400).json({ error: "El área no existe en la base de datos" });
    }
    // Permitir reserva si el área no está en mantenimiento
    if (area.status === 'Mantenimiento') {
      return res.status(400).json({ error: "El área está en mantenimiento y no acepta reservas" });
    }

    // Verificar conflicto de horario
    const reservationDate = new Date(date);
    const conflicto = await prisma.reservation.findFirst({
      where: {
        areaId,
        date: reservationDate,
        status: { in: ['Pendiente', 'Aprobada'] },
        timeStart: { lt: timeEnd },
        timeEnd: { gt: timeStart }
      }
    });

    if (conflicto) {
      return res.status(409).json({ error: "Ya existe una reserva en ese horario para esta área" });
    }

    // Crear la reserva
    const reservation = await prisma.reservation.create({
      data: {
        date: reservationDate,
        timeStart,
        timeEnd,
        status: 'Pendiente',
        userId: req.user.id,
        areaId
      },
      include: { area: true, user: { select: { id: true, name: true, depto: true } } }
    });

    res.status(201).json(reservation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la reserva" });
  }
});

// PATCH /api/reservations/:id/status - Cambiar estado (solo ADMIN)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: "Solo el administrador puede aprobar/rechazar reservas" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['Aprobada', 'Rechazada'].includes(status)) {
      return res.status(400).json({ error: "Status inválido. Debe ser 'Aprobada' o 'Rechazada'" });
    }

    const reservation = await prisma.reservation.findUnique({ where: { id: parseInt(id) } });
    if (!reservation) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    const updated = await prisma.reservation.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { area: true, user: { select: { id: true, name: true, depto: true } } }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar la reserva" });
  }
});

// DELETE /api/reservations/:id - Cancelar reserva (RESIDENTE solo sus propias pendientes)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const reservation = await prisma.reservation.findUnique({ where: { id: parseInt(id) } });

    if (!reservation) {
      return res.status(404).json({ error: "Reserva no encontrada" });
    }

    // Si es residente, solo puede cancelar las suyas y solo si están pendientes
    if (req.user.role !== 'ADMIN') {
      if (reservation.userId !== req.user.id) {
        return res.status(403).json({ error: "No puedes cancelar reservas de otros usuarios" });
      }
      if (reservation.status !== 'Pendiente') {
        return res.status(400).json({ error: "Solo puedes cancelar reservas pendientes" });
      }
    }

    await prisma.reservation.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Reserva cancelada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cancelar la reserva" });
  }
});

export default router;

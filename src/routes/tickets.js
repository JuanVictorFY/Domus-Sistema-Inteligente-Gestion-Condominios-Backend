import express from 'express';
import { authenticate, checkRole } from '../middlewares/auth.middleware.js';
import { prisma } from '../config/prisma.js';

const router = express.Router();

// GET /api/tickets - Admin ve todos, Residente ve los suyos
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority, search } = req.query;
    const where = {};

    if (req.user.role === 'RESIDENTE') {
      where.userId = req.user.id;
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { desc: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: { user: { select: { id: true, name: true, depto: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tickets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar los tickets" });
  }
});

// GET /api/tickets/:id - Detalle de un ticket
router.get('/:id', authenticate, async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: { select: { id: true, name: true, depto: true } } }
    });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (req.user.role === 'RESIDENTE' && ticket.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    res.json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener el ticket' });
  }
});

// POST /api/tickets - Crear ticket
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, desc, priority } = req.body;
    if (!title || !desc) {
      return res.status(400).json({ error: "Título y descripción son requeridos" });
    }
    const ticket = await prisma.ticket.create({
      data: {
        title,
        desc,
        priority: priority || 'Media',
        status: 'Pendiente',
        userId: req.user.id
      },
      include: { user: { select: { id: true, name: true, depto: true } } }
    });
    res.status(201).json(ticket);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el ticket" });
  }
});

// PUT /api/tickets/:id/status - Admin cambia estado
router.put('/:id/status', authenticate, checkRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validTransitions = {
      'Pendiente': ['En Proceso', 'Completado'],
      'En Proceso': ['Completado', 'Pendiente'],
      'Completado': [],
      'Cancelado': []
    };
    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (!validTransitions[ticket.status]?.includes(status)) {
      return res.status(400).json({ error: `No se puede cambiar de "${ticket.status}" a "${status}"` });
    }
    const updated = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { user: { select: { id: true, name: true, depto: true } } }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cambiar estado del ticket" });
  }
});

// PUT /api/tickets/:id/assign - Admin asigna técnico
router.put('/:id/assign', authenticate, checkRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    if (!assignedTo || assignedTo.trim().length === 0) {
      return res.status(400).json({ error: 'Nombre del técnico requerido' });
    }
    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const updated = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { assignedTo: assignedTo.trim() },
      include: { user: { select: { id: true, name: true, depto: true } } }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al asignar técnico" });
  }
});

// PUT /api/tickets/:id/notes - Admin agrega notas
router.put('/:id/notes', authenticate, checkRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    const updated = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { notes: notes || null },
      include: { user: { select: { id: true, name: true, depto: true } } }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar notas" });
  }
});

// PUT /api/tickets/:id/cancel - Residente cancela su ticket pendiente
router.put('/:id/cancel', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    if (ticket.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (ticket.status !== 'Pendiente') {
      return res.status(400).json({ error: 'Solo se pueden cancelar tickets pendientes' });
    }
    const updated = await prisma.ticket.update({
      where: { id: parseInt(id) },
      data: { status: 'Cancelado' },
      include: { user: { select: { id: true, name: true, depto: true } } }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cancelar ticket" });
  }
});

// DELETE /api/tickets/:id - Solo admin puede eliminar
router.delete('/:id', authenticate, checkRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma.ticket.findUnique({ where: { id: parseInt(id) } });
    if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' });
    await prisma.ticket.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Ticket eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar ticket" });
  }
});

export default router;

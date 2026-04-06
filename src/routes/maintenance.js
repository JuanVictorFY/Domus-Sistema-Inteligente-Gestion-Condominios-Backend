import express from 'express';
import { authenticate, checkRole } from '../middlewares/auth.middleware.js';
import { prisma } from '../config/prisma.js';

const router = express.Router();

// GET /api/maintenance
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, priority } = req.query;
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };

    if (status) where.status = status;
    if (priority) where.priority = priority;

    const records = await prisma.maintenanceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, depto: true } } }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener solicitudes de mantenimiento.' });
  }
});

// POST /api/maintenance
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, description, area, priority } = req.body;
    if (!title || !description) {
      return res.status(400).json({ message: 'Título y descripción son obligatorios.' });
    }
    const record = await prisma.maintenanceRequest.create({
      data: {
        userId: req.user.id,
        title,
        description,
        area: area || 'General',
        priority: priority || 'MEDIA',
        status: 'PENDIENTE'
      }
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la solicitud.' });
  }
});

// PUT /api/maintenance/:id/status
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const record = await prisma.maintenanceRequest.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el estado.' });
  }
});

export default router;

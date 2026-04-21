import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/parcels — Listar paquetes del residente autenticado
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const parcels = await prisma.parcel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, depto: true } } }
    });
    res.json(parcels);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los paquetes.' });
  }
});

// POST /api/parcels — Registrar un paquete (seguridad/admin)
router.post('/', authenticate, async (req, res) => {
  try {
    const { userId, description, carrier, trackingCode } = req.body;
    const parcel = await prisma.parcel.create({
      data: { userId: parseInt(userId), description, carrier, trackingCode, status: 'PENDIENTE' }
    });
    res.status(201).json(parcel);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el paquete.' });
  }
});

// PUT /api/parcels/:id/deliver — Marcar paquete como entregado
router.put('/:id/deliver', authenticate, async (req, res) => {
  try {
    const parcel = await prisma.parcel.update({
      where: { id: parseInt(req.params.id) },
      data: { status: 'ENTREGADO', deliveredAt: new Date() }
    });
    res.json(parcel);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el estado del paquete.' });
  }
});

export default router;

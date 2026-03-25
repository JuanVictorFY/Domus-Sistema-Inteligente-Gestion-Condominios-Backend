import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/vehicles — Vehículos del residente
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const vehicles = await prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, depto: true } } }
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los vehículos.' });
  }
});

// POST /api/vehicles — Registrar vehículo
router.post('/', authenticate, async (req, res) => {
  try {
    const { brand, model, plate, color, year } = req.body;
    if (!plate) return res.status(400).json({ message: 'La placa es obligatoria.' });

    const existing = await prisma.vehicle.findFirst({ where: { plate: plate.toUpperCase() } });
    if (existing) return res.status(400).json({ message: 'Ya existe un vehículo con esa placa.' });

    const vehicle = await prisma.vehicle.create({
      data: { userId: req.user.id, brand, model, plate: plate.toUpperCase(), color, year: year ? parseInt(year) : null }
    });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el vehículo.' });
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Vehículo eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el vehículo.' });
  }
});

export default router;

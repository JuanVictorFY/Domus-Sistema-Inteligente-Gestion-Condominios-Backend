import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

const parseId = (id) => /^\d+$/.test(id) ? parseInt(id, 10) : id;

// GET: Obtener todas las áreas con filtro de estado
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const areas = await prisma.area.findMany({ where, orderBy: { name: 'asc' } });
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar las áreas" });
  }
});

// POST: Crear un área nueva
router.post('/', async (req, res) => {
  try {
    const { name, capacity, status, color, icon } = req.body;
    const newArea = await prisma.area.create({
      data: { name, capacity, status, color, icon }
    });
    res.json(newArea);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el área" });
  }
});

// PUT: Editar un área (o cambiar su estado)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, status, color, icon } = req.body;
    const updated = await prisma.area.update({
      where: { id: parseId(id) },
      data: { name, capacity, status, color, icon }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el área" });
  }
});

// DELETE: Eliminar un área
router.delete('/:id', async (req, res) => {
  try {
    await prisma.area.delete({ where: { id: parseId(req.params.id) } });
    res.json({ message: "Área eliminada" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el área" });
  }
});

export default router;
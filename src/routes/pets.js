import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/pets
router.get('/', authenticate, async (req, res) => {
  try {
    const where = req.user.role === 'ADMIN' ? {} : { userId: req.user.id };
    const pets = await prisma.pet.findMany({ where, include: { user: { select: { name: true, depto: true } } } });
    res.json(pets);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las mascotas.' });
  }
});

// POST /api/pets
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, species, breed, color } = req.body;
    if (!name || !species) return res.status(400).json({ message: 'Nombre y especie son obligatorios.' });
    const pet = await prisma.pet.create({ data: { userId: req.user.id, name, species, breed, color } });
    res.status(201).json(pet);
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la mascota.' });
  }
});

// DELETE /api/pets/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.pet.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Mascota eliminada.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la mascota.' });
  }
});

export default router;

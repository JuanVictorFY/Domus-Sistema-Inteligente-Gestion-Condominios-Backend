import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/family - Obtener integrantes del residente autenticado
router.get('/', authenticate, async (req, res) => {
  try {
    const members = await prisma.familyMember.findMany({
      where: { userId: req.user.id },
      orderBy: { id: 'asc' }
    });
    res.json(members);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar integrantes" });
  }
});

// POST /api/family - Agregar integrante
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, relation, phone } = req.body;
    if (!name || !relation) {
      return res.status(400).json({ error: "Nombre y parentesco son requeridos" });
    }
    const member = await prisma.familyMember.create({
      data: { name, relation, phone: phone || null, userId: req.user.id }
    });
    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al agregar integrante" });
  }
});

// DELETE /api/family/:id - Eliminar integrante (solo el dueño)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const member = await prisma.familyMember.findUnique({ where: { id: parseInt(id) } });
    if (!member) return res.status(404).json({ error: "Integrante no encontrado" });
    if (member.userId !== req.user.id) return res.status(403).json({ error: "No autorizado" });
    
    await prisma.familyMember.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Integrante eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar integrante" });
  }
});

export default router;

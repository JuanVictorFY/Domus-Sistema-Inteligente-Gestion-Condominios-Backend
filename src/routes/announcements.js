import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

const parseId = (id) => /^\d+$/.test(id) ? parseInt(id, 10) : id;

// GET: Obtener todos los comunicados con filtro por tipo
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, scope } = req.query;
    const where = {};
    if (type) where.type = type;
    if (scope) where.scope = scope;

    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Error al cargar los comunicados" });
  }
});

// POST: Crear un nuevo comunicado (solo admin)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Sin permisos.' });
    const { title, desc, scope, type } = req.body;
    if (!title || !desc) return res.status(400).json({ error: 'Título y descripción son requeridos.' });
    const newAnnouncement = await prisma.announcement.create({
      data: { title, desc, scope: scope || 'TODOS', type: type || 'INFO' }
    });
    res.status(201).json(newAnnouncement);
  } catch (error) {
    res.status(500).json({ error: "Error al crear el comunicado" });
  }
});

// PUT: Editar un comunicado
router.put('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Sin permisos.' });
    const { id } = req.params;
    const { title, desc, scope, type } = req.body;
    const updated = await prisma.announcement.update({
      where: { id: parseId(id) },
      data: { title, desc, scope, type }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar el comunicado" });
  }
});

// DELETE: Eliminar un comunicado
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Sin permisos.' });
    await prisma.announcement.delete({ where: { id: parseId(req.params.id) } });
    res.json({ message: "Comunicado eliminado" });
  } catch (error) {
    res.status(500).json({ error: "Error al eliminar el comunicado" });
  }
});

export default router;

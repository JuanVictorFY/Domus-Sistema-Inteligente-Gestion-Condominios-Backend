import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/documents — Documentos del condominio publicados por el admin
router.get('/', authenticate, async (req, res) => {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, category: true, fileUrl: true, createdAt: true }
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los documentos.' });
  }
});

// POST /api/documents — Publicar documento (solo admin)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Solo el administrador puede publicar documentos.' });
    }
    const { title, category, fileUrl } = req.body;
    if (!title || !fileUrl) return res.status(400).json({ message: 'Título y URL son obligatorios.' });

    const doc = await prisma.document.create({ data: { title, category: category || 'General', fileUrl } });
    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: 'Error al publicar el documento.' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Sin permisos.' });
    await prisma.document.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Documento eliminado.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el documento.' });
  }
});

export default router;

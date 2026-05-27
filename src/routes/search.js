import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/search?q=texto — Búsqueda global de residentes, comunicados y tickets
router.get('/', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'La búsqueda debe tener al menos 2 caracteres.' });
    }

    const term = { contains: q.trim(), mode: 'insensitive' };

    const [users, announcements, tickets] = await Promise.all([
      req.user.role === 'ADMIN'
        ? prisma.user.findMany({ where: { OR: [{ name: term }, { email: term }, { depto: term }] }, take: 10, select: { id: true, name: true, email: true, depto: true, role: true } })
        : [],
      prisma.announcement.findMany({ where: { OR: [{ title: term }, { content: term }] }, take: 5, orderBy: { createdAt: 'desc' } }),
      prisma.ticket.findMany({ where: { OR: [{ title: term }, { description: term }], userId: req.user.role !== 'ADMIN' ? req.user.id : undefined }, take: 5, orderBy: { createdAt: 'desc' } }),
    ]);

    res.json({ users, announcements, tickets });
  } catch (error) {
    res.status(500).json({ message: 'Error en la búsqueda.' });
  }
});

export default router;

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/logentries - Obtener bitácora
router.get('/', authenticate, async (req, res) => {
  try {
    const entries = await prisma.logEntry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(entries);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar la bitácora" });
  }
});

// POST /api/logentries - Crear entrada en bitácora
router.post('/', authenticate, async (req, res) => {
  try {
    const { title, desc, type, shift } = req.body;
    if (!title || !type) {
      return res.status(400).json({ error: "Título y tipo son requeridos" });
    }
    const entry = await prisma.logEntry.create({
      data: { title, desc: desc || '', type, shift: shift || 'Día' }
    });
    res.status(201).json(entry);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar en bitácora" });
  }
});

export default router;

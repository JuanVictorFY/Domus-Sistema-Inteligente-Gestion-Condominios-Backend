import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, checkRole } from "../middlewares/auth.middleware.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/polls - Obtener todas las votaciones con conteo de votos
router.get('/', authenticate, async (req, res) => {
  try {
    const polls = await prisma.poll.findMany({
      include: { votes: true },
      orderBy: { createdAt: 'desc' }
    });

    // Agregar info de si el usuario ya votó y los porcentajes
    const enriched = polls.map(poll => {
      const options = JSON.parse(poll.options);
      const totalVotes = poll.votes.length;
      const userVote = poll.votes.find(v => v.userId === req.user.id);
      
      const results = options.map(opt => ({
        option: opt,
        count: poll.votes.filter(v => v.option === opt).length,
        percentage: totalVotes > 0 ? Math.round((poll.votes.filter(v => v.option === opt).length / totalVotes) * 100) : 0
      }));

      return {
        id: poll.id,
        title: poll.title,
        description: poll.description,
        options,
        status: poll.status,
        closesAt: poll.closesAt,
        createdAt: poll.createdAt,
        totalVotes,
        results,
        userVoted: !!userVote,
        userChoice: userVote?.option || null
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar las votaciones" });
  }
});

// POST /api/polls - Admin crea una votación
router.post('/', authenticate, checkRole(['ADMIN']), async (req, res) => {
  try {
    const { title, description, options, closesAt } = req.body;

    if (!title || !description || !options || !closesAt) {
      return res.status(400).json({ error: "Todos los campos son requeridos" });
    }

    const poll = await prisma.poll.create({
      data: {
        title,
        description,
        options: JSON.stringify(options),
        status: 'Activa',
        closesAt: new Date(closesAt)
      }
    });

    res.status(201).json(poll);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear la votación" });
  }
});

// POST /api/polls/:id/vote - Residente vota
router.post('/:id/vote', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { option } = req.body;

    if (!option) {
      return res.status(400).json({ error: "Debes seleccionar una opción" });
    }

    const poll = await prisma.poll.findUnique({ where: { id: parseInt(id) } });
    if (!poll) return res.status(404).json({ error: "Votación no encontrada" });
    if (poll.status !== 'Activa') return res.status(400).json({ error: "Esta votación ya está cerrada" });

    // Verificar que la opción es válida
    const validOptions = JSON.parse(poll.options);
    if (!validOptions.includes(option)) {
      return res.status(400).json({ error: "Opción no válida" });
    }

    // Verificar si ya votó
    const existingVote = await prisma.vote.findUnique({
      where: { userId_pollId: { userId: req.user.id, pollId: parseInt(id) } }
    });
    if (existingVote) {
      return res.status(400).json({ error: "Ya has votado en esta encuesta" });
    }

    await prisma.vote.create({
      data: {
        option,
        userId: req.user.id,
        pollId: parseInt(id)
      }
    });

    res.json({ message: "Voto registrado exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar el voto" });
  }
});

// PUT /api/polls/:id/close - Admin cierra una votación
router.put('/:id/close', authenticate, checkRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.poll.update({
      where: { id: parseInt(id) },
      data: { status: 'Cerrada' }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cerrar la votación" });
  }
});

// DELETE /api/polls/:id - Admin elimina una votación
router.delete('/:id', authenticate, checkRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.vote.deleteMany({ where: { pollId: parseInt(id) } });
    await prisma.poll.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Votación eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la votación" });
  }
});

export default router;

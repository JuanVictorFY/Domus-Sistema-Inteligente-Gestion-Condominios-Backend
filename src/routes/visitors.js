import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/visitors - Obtener visitas (filtrado por rol)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    // Si es residente, solo ve sus propias visitas
    if (req.user.role === 'RESIDENTE') {
      where.userId = req.user.id;
    }

    // Filtrar por status si se proporciona
    if (status) {
      where.status = status;
    }

    const visitors = await prisma.visitor.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, depto: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(visitors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar las visitas" });
  }
});

// POST /api/visitors - Crear visita (RESIDENTE autoriza visitante)
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, dni, type, fechaVisita } = req.body;

    if (!name || !type || !fechaVisita) {
      return res.status(400).json({ error: "Nombre, tipo y fecha son requeridos" });
    }

    // Generar PIN aleatorio de 4 dígitos
    const pin = String(Math.floor(1000 + Math.random() * 9000));

    const visitor = await prisma.visitor.create({
      data: {
        name,
        dni: dni || null,
        type,
        pin,
        status: 'Pendiente',
        fechaVisita: new Date(fechaVisita),
        userId: req.user.id
      },
      include: {
        user: { select: { id: true, name: true, depto: true } }
      }
    });

    res.status(201).json(visitor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar la visita" });
  }
});

// PATCH /api/visitors/:id/status - Cambiar estado (ADMIN o SEGURIDAD)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SEGURIDAD') {
      return res.status(403).json({ error: "Solo administrador o seguridad pueden gestionar visitas" });
    }

    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Aprobado', 'Rechazado', 'Ingresó', 'Salió'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status inválido. Debe ser: ${validStatuses.join(', ')}` });
    }

    const visitor = await prisma.visitor.findUnique({ where: { id: parseInt(id) } });
    if (!visitor) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }

    const updated = await prisma.visitor.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: { select: { id: true, name: true, depto: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar el estado de la visita" });
  }
});

// PUT /api/visitors/:id/status - Alias para PATCH (usado por seguridad)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SEGURIDAD') {
      return res.status(403).json({ error: "No autorizado" });
    }
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['Aprobado', 'Rechazado', 'Ingresó', 'Salió'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Status inválido" });
    }
    const updated = await prisma.visitor.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { user: { select: { id: true, name: true, depto: true } } }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar visita" });
  }
});

// DELETE /api/visitors/:id - Eliminar visita
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await prisma.visitor.findUnique({ where: { id: parseInt(id) } });

    if (!visitor) {
      return res.status(404).json({ error: "Visita no encontrada" });
    }

    if (req.user.role !== 'ADMIN') {
      if (visitor.userId !== req.user.id) {
        return res.status(403).json({ error: "No puedes eliminar visitas de otros usuarios" });
      }
      if (visitor.status !== 'Pendiente') {
        return res.status(400).json({ error: "Solo puedes cancelar visitas pendientes" });
      }
    }

    await prisma.visitor.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Visita eliminada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar la visita" });
  }
});

export default router;

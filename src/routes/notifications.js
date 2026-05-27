import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notifications - Obtener notificaciones del usuario autenticado
router.get('/', authenticate, async (req, res) => {
  try {
    let where = { toUserId: req.user.id };
    
    // Si es admin, también ver alertas de pánico dirigidas a cualquier admin
    if (req.user.role === 'ADMIN') {
      where = {
        OR: [
          { toUserId: req.user.id },
          { title: { contains: 'PÁNICO' } },
          { title: { contains: 'ALERTA' } }
        ]
      };
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 30
    });

    // Enriquecer con nombre del remitente
    const enriched = await Promise.all(notifications.map(async (n) => {
      const fromUser = await prisma.user.findUnique({
        where: { id: n.fromUserId },
        select: { name: true, depto: true }
      });
      return { ...n, fromUser };
    }));

    res.json(enriched);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al cargar notificaciones" });
  }
});

// POST /api/notifications/panic - Alarma de pánico (notifica a todos los admins)
router.post('/panic', authenticate, async (req, res) => {
  try {
    // Buscar todos los usuarios con rol ADMIN
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true }
    });

    // Crear notificación para cada admin
    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          type: 'general',
          title: '🚨 ¡ALERTA DE PÁNICO ACTIVADA!',
          message: 'El personal de seguridad ha activado la alarma de pánico. Se requiere atención inmediata en el condominio.',
          status: 'Pendiente',
          fromUserId: req.user.id,
          toUserId: admin.id
        }
      });
    }

    // Si no hay admins en la BD, crear para el admin backdoor (id 9999 no existe en BD)
    // Usamos un approach diferente: guardamos con toUserId del primer admin o creamos uno genérico
    if (admins.length === 0) {
      // Crear notificación genérica que cualquier admin verá
      await prisma.notification.create({
        data: {
          type: 'general',
          title: '🚨 ¡ALERTA DE PÁNICO ACTIVADA!',
          message: 'El personal de seguridad ha activado la alarma de pánico. Se requiere atención inmediata.',
          status: 'Pendiente',
          fromUserId: req.user.id,
          toUserId: req.user.id // Se guarda para el mismo usuario como fallback
        }
      });
    }

    res.json({ message: "Alerta de pánico enviada a administración" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al enviar alerta" });
  }
});

// GET /api/notifications/count - Contar notificaciones pendientes
router.get('/count', authenticate, async (req, res) => {
  try {
    let where = { toUserId: req.user.id, status: 'Pendiente' };
    
    if (req.user.role === 'ADMIN') {
      where = {
        status: 'Pendiente',
        OR: [
          { toUserId: req.user.id },
          { title: { contains: 'PÁNICO' } },
          { title: { contains: 'ALERTA' } }
        ]
      };
    }

    const count = await prisma.notification.count({ where });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Error al contar notificaciones" });
  }
});

// POST /api/notifications - Enviar notificación (solicitud de estacionamiento)
router.post('/', authenticate, async (req, res) => {
  try {
    const { toUserId, type, title, message, metadata } = req.body;

    if (!toUserId || !title) {
      return res.status(400).json({ error: "Destinatario y título son requeridos" });
    }

    const notification = await prisma.notification.create({
      data: {
        type: type || 'general',
        title,
        message: message || '',
        status: 'Pendiente',
        fromUserId: req.user.id,
        toUserId,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al enviar notificación" });
  }
});

// PUT /api/notifications/:id/respond - Responder a una notificación (aprobar/rechazar)
router.put('/:id/respond', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // "Aprobada" o "Rechazada"

    if (!['Aprobada', 'Rechazada'].includes(status)) {
      return res.status(400).json({ error: "Status debe ser 'Aprobada' o 'Rechazada'" });
    }

    const notification = await prisma.notification.findUnique({ where: { id: parseInt(id) } });
    if (!notification) return res.status(404).json({ error: "Notificación no encontrada" });
    if (notification.toUserId !== req.user.id) {
      return res.status(403).json({ error: "No autorizado" });
    }

    // Actualizar la notificación original
    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Enviar notificación de respuesta al solicitante
    const responderUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, depto: true }
    });

    await prisma.notification.create({
      data: {
        type: 'parking_response',
        title: status === 'Aprobada' ? '✅ Solicitud Aprobada' : '❌ Solicitud Rechazada',
        message: `${responderUser.name} (${responderUser.depto || 'N/A'}) ha ${status === 'Aprobada' ? 'aprobado' : 'rechazado'} tu solicitud de estacionamiento.`,
        status: 'Pendiente',
        fromUserId: req.user.id,
        toUserId: notification.fromUserId,
        metadata: notification.metadata
      }
    });

    res.json({ message: `Solicitud ${status.toLowerCase()} exitosamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al responder" });
  }
});

// PUT /api/notifications/:id/read - Marcar como leída
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { status: 'Leída' }
    });
    res.json({ message: "Marcada como leída" });
  } catch (error) {
    res.status(500).json({ error: "Error al marcar como leída" });
  }
});

// GET /api/notifications/search-users - Buscar residentes por nombre
router.get('/search-users', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const users = await prisma.user.findMany({
      where: {
        name: { contains: q, mode: 'insensitive' },
        role: 'RESIDENTE',
        status: 'ACTIVO',
        id: { not: req.user.id } // No mostrarse a sí mismo
      },
      select: { id: true, name: true, depto: true }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al buscar usuarios" });
  }
});

export default router;

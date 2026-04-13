import { prisma } from '../config/prisma.js';

export const getTicketById = (id) =>
  prisma.ticket.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, depto: true } } },
  });

export const countTicketsByStatus = async (userId = null) => {
  const where = userId ? { userId } : {};
  const statuses = ['Pendiente', 'En Proceso', 'Completado', 'Cancelado'];
  const counts = await Promise.all(
    statuses.map((status) => prisma.ticket.count({ where: { ...where, status } }))
  );
  return statuses.reduce((acc, status, i) => ({ ...acc, [status]: counts[i] }), {});
};

export const getRecentTickets = (limit = 5) =>
  prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { user: { select: { name: true, depto: true } } },
  });

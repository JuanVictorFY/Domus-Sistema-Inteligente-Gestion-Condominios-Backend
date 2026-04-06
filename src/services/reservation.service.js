import { prisma } from '../config/prisma.js';

export const checkOverlap = async ({ areaId, date, timeStart, timeEnd, excludeId = null }) => {
  const where = {
    areaId,
    date: new Date(date),
    status: { in: ['Pendiente', 'Aprobada'] },
    timeStart: { lt: timeEnd },
    timeEnd: { gt: timeStart },
  };
  if (excludeId) {
    where.id = { not: excludeId };
  }
  return prisma.reservation.findFirst({ where });
};

export const getReservationsByUser = (userId, opts = {}) =>
  prisma.reservation.findMany({
    where: { userId, ...opts.where },
    include: { area: true },
    orderBy: { date: 'desc' },
    skip: opts.skip ?? 0,
    take: opts.take ?? 20,
  });

export const getUpcomingReservations = (userId) => {
  const now = new Date();
  return prisma.reservation.findMany({
    where: { userId, date: { gte: now }, status: 'Aprobada' },
    include: { area: true },
    orderBy: { date: 'asc' },
    take: 5,
  });
};

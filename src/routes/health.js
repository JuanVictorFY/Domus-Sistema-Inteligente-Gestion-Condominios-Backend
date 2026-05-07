import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/health — Estado del servidor y la base de datos
router.get('/', async (_req, res) => {
  const start = Date.now();
  let dbStatus = 'ok';
  let dbLatency = null;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    server: { uptime: Math.round(process.uptime()), memory: process.memoryUsage().rss },
    database: { status: dbStatus, latencyMs: dbLatency },
    responseMs: Date.now() - start,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

export default router;

import { randomUUID } from 'crypto';

export const requestLogger = (req, res, next) => {
  const id = randomUUID().slice(0, 8);
  const start = Date.now();
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '-';

  res.on('finish', () => {
    const ms = Date.now() - start;
    const color = res.statusCode >= 500 ? '\x1b[31m'
      : res.statusCode >= 400 ? '\x1b[33m'
      : res.statusCode >= 200 ? '\x1b[32m' : '\x1b[0m';
    const ts = new Date().toISOString();
    console.log(`[${ts}] [${id}] ${ip} ${color}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} — ${ms}ms`);
  });
  next();
};

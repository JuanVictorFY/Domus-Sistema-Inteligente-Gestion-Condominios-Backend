import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import { sanitizeInputs } from './src/middlewares/sanitize.middleware.js';
import { requestLogger } from './src/middlewares/logger.middleware.js';
import { errorHandler } from './src/middlewares/errorHandler.middleware.js';
import authRoutes from './src/routes/auth.routes.js';
import usersRouter from './src/routes/users.js';
import announcementsRouter from './src/routes/announcements.js';
import areasRouter from './src/routes/areas.js';
import ticketsRouter from './src/routes/tickets.js';

import reservationsRouter from './src/routes/reservations.js';
import visitorsRouter from './src/routes/visitors.js';
import pollsRouter from './src/routes/polls.js';
import notificationsRouter from './src/routes/notifications.js';
import familyRouter from './src/routes/family.js';
import contactRouter from './src/routes/contact.js';
import logEntriesRouter from './src/routes/logentries.js';
import statsRouter from './src/routes/stats.js';
import healthRouter from './src/routes/health.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate Limiting - Limitar peticiones por IP
const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 500, // máximo 500 peticiones por minuto por IP
  message: { error: 'Demasiadas peticiones. Intenta de nuevo en 1 minuto.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate Limiting estricto para login/registro (prevenir fuerza bruta)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos de login por 15 minutos
  message: { error: 'Demasiados intentos de acceso. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Middlewares principales
app.use(compression()); // Comprimir respuestas
app.use(generalLimiter); // Rate limiting global
app.use(cors({
  origin: process.env.FRONTEND_URL || true,
})); // Permite peticiones desde el frontend - DEBE ir antes de helmet
app.use(helmet({ crossOriginResourcePolicy: false })); // Headers de seguridad
app.use(express.json()); // Permite a Express entender JSON en las peticiones (req.body)
app.use(sanitizeInputs); // Sanitizar todos los inputs
app.use(requestLogger);  // Logging de peticiones HTTP

// --- RUTAS DE LA API ---
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRouter);
app.use('/api/announcements', announcementsRouter);
app.use('/api/areas', areasRouter);
app.use('/api/tickets', ticketsRouter);

app.use('/api/reservations', reservationsRouter);
app.use('/api/visitors', visitorsRouter);
app.use('/api/polls', pollsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/family', familyRouter);
app.use('/api/contact', contactRouter);
app.use('/api/logentries', logEntriesRouter);
app.use('/api/stats', statsRouter);
app.use('/api/health', healthRouter);

// Ruta raíz
app.get('/', (_req, res) => {
  res.json({
    name: 'Domus API',
    version: '1.0.0',
    description: 'Sistema Inteligente de Gestión de Condominios',
    health: '/api/health',
    docs: 'https://github.com/JuanVictorFY/Domus-Sistema-Inteligente-Gestion-Condominios-Backend'
  });
});

app.use(errorHandler);

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
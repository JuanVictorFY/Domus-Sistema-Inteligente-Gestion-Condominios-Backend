const PRISMA_ERRORS = {
  P2002: { status: 409, message: 'Ya existe un registro con ese valor único' },
  P2025: { status: 404, message: 'Registro no encontrado' },
  P2003: { status: 400, message: 'Referencia de clave foránea inválida' },
  P2014: { status: 400, message: 'La relación no existe' },
};

export const errorHandler = (err, req, res, _next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] [Error] ${req.method} ${req.originalUrl} — ${err.message}`);

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Token inválido' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'La sesión ha expirado' });
  }

  const prismaErr = PRISMA_ERRORS[err.code];
  if (prismaErr) {
    return res.status(prismaErr.status).json({ error: prismaErr.message });
  }

  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Error interno del servidor' : err.message,
  });
};

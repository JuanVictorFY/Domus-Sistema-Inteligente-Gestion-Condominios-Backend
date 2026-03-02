export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'No autenticado.' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'No tienes permisos para realizar esta acción.' });
  }
  next();
};

export const isAdmin    = requireRole('ADMIN');
export const isResident = requireRole('ADMIN', 'RESIDENTE');
export const isSecurity = requireRole('ADMIN', 'SEGURIDAD');

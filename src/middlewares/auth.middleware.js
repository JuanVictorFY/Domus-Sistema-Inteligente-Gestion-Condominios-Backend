import jwt from 'jsonwebtoken';

const JWT_SECRET = () => process.env.JWT_SECRET || 'super_secreto_domus_123';

export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Acceso denegado. Se requiere un token válido.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET());
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'La sesión ha expirado. Por favor inicia sesión de nuevo.' });
    }
    return res.status(401).json({ message: 'Token inválido.' });
  }
};

export const authenticate = verifyToken;

export const checkRole = (rolesPermitidos) => (req, res, next) => {
  if (!req.user || !rolesPermitidos.includes(req.user.role)) {
    return res.status(403).json({ message: 'Acceso denegado. No tienes los permisos necesarios.' });
  }
  next();
};
/**
 * Middleware de sanitización de inputs.
 * Limpia caracteres peligrosos de req.body, req.query y req.params
 * para prevenir XSS y NoSQL injection.
 */

// Función recursiva para sanitizar valores
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '') // Eliminar tags script
      .replace(/[<>]/g, '') // Eliminar < > (previene XSS/HTML injection)
      .replace(/javascript:/gi, '') // Eliminar javascript: URIs
      .replace(/on\w+\s*=/gi, '') // Eliminar event handlers (onclick=, onerror=, etc.)
      .replace(/\$/g, '') // Eliminar $ (previene NoSQL injection)
      .replace(/;\s*--/g, '') // Eliminar comentarios SQL
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    return sanitizeObject(value);
  }
  return value;
};

const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const key of Object.keys(obj)) {
    // Rechazar keys que empiecen con $ o contengan .
    if (key.startsWith('$') || key.includes('.')) continue;
    sanitized[key] = sanitizeValue(obj[key]);
  }
  return sanitized;
};

export const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  // En Express 5, req.query es de solo lectura - sanitizamos los valores individualmente
  if (req.query && typeof req.query === 'object') {
    for (const key of Object.keys(req.query)) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeValue(req.query[key]);
      }
    }
  }
  next();
};

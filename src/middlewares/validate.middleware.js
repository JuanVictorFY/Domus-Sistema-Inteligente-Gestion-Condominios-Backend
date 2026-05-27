export const validateBody = (fields) => (req, res, next) => {
  const missing = fields.filter((f) => {
    const val = req.body[f];
    return val === undefined || val === null || String(val).trim() === '';
  });
  if (missing.length > 0) {
    return res.status(400).json({
      message: `Campos requeridos faltantes: ${missing.join(', ')}`
    });
  }
  next();
};

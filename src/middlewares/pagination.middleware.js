export const paginationMiddleware = (req, _res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  req.query.page = Math.max(1, page);
  req.query.limit = Math.min(100, Math.max(1, limit));

  next();
};

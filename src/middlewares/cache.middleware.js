const store = new Map();

export const cache = (ttlSeconds = 60) => (req, res, next) => {
  const key = `${req.method}:${req.originalUrl}`;
  const cached = store.get(key);
  if (cached && Date.now() - cached.ts < ttlSeconds * 1000) {
    return res.json(cached.data);
  }
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    store.set(key, { data, ts: Date.now() });
    return originalJson(data);
  };
  next();
};

export const clearCache = (pattern) => {
  for (const key of store.keys()) {
    if (key.includes(pattern)) store.delete(key);
  }
};

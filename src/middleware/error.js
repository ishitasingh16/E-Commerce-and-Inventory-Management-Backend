function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
}

function errorHandler(error, req, res, next) {
  if (error && error.code === 11000) {
    return res.status(409).json({ error: 'Duplicate value', field: Object.keys(error.keyPattern || {})[0] });
  }
  if (error && error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid identifier format' });
  }
  if (error && error.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: Object.values(error.errors).map(e => e.message) });
  }
  const status = error.status || error.statusCode || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message });
}

module.exports = { notFound, errorHandler };

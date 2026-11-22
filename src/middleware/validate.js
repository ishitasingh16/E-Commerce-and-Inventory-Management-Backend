function requiredFields(fields) {
  return (req, res, next) => {
    const missing = fields.filter(field => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
    if (missing.length) return res.status(400).json({ error: 'Validation failed', missingFields: missing });
    next();
  };
}

function positiveInteger(field) {
  return (req, res, next) => {
    const value = req.body[field] ?? req.params[field];
    if (!Number.isInteger(Number(value)) || Number(value) < 1) {
      return res.status(400).json({ error: `${field} must be a positive integer` });
    }
    next();
  };
}

module.exports = { requiredFields, positiveInteger };

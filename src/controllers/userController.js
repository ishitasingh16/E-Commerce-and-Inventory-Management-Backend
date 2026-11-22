const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function getMe(req, res) {
  res.json({ user: req.user });
}

async function updateMe(req, res, next) {
  try {
    const allowed = {};
    if (req.body.name) allowed.name = req.body.name;
    if (req.body.email) allowed.email = req.body.email.toLowerCase();
    if (req.body.password) {
      if (req.body.password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      allowed.passwordHash = await bcrypt.hash(req.body.password, 12);
    }
    const user = await User.findByIdAndUpdate(req.user._id, allowed, { new: true, runValidators: true });
    res.json({ user });
  } catch (error) { next(error); }
}

async function listUsers(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  const [users, total] = await Promise.all([
    User.find(filter).skip((page - 1) * limit).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(filter)
  ]);
  res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function changeRole(req, res, next) {
  try {
    if (!['customer', 'seller', 'admin'].includes(req.body.role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) { next(error); }
}

module.exports = { getMe, updateMe, listUsers, changeRole };

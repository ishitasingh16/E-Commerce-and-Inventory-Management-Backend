const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signAccessToken, signRefreshToken } = require('../config/jwt');

const hashToken = token => crypto.createHash('sha256').update(token).digest('hex');

async function saveRefreshToken(user, refreshToken) {
  const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({ tokenHash: hashToken(refreshToken), expiresAt: new Date(payload.exp * 1000) });
  await user.save();
}

async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email and password are required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (role && !['customer', 'seller'].includes(role)) return res.status(400).json({ error: 'Only customer or seller may self-register' });
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role: role || 'customer' });
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await saveRefreshToken(user, refreshToken);
    res.status(201).json({
      accessToken, refreshToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) { next(error); }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash +refreshTokens');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    await saveRefreshToken(user, refreshToken);
    res.json({ accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) { next(error); }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });
    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(payload.sub).select('+refreshTokens');
    if (!user) return res.status(401).json({ error: 'Invalid refresh token' });
    const tokenHash = hashToken(refreshToken);
    const stored = user.refreshTokens.find(t => t.tokenHash === tokenHash && t.expiresAt > new Date());
    if (!stored) return res.status(401).json({ error: 'Invalid or revoked refresh token' });
    user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== tokenHash);
    const newRefreshToken = signRefreshToken(user);
    await saveRefreshToken(user, newRefreshToken);
    res.json({ accessToken: signAccessToken(user), refreshToken: newRefreshToken });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const user = await User.findById(req.user._id).select('+refreshTokens');
    if (!refreshToken) {
      user.refreshTokens = [];
    } else {
      const tokenHash = hashToken(refreshToken);
      user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== tokenHash);
    }
    await user.save();
    res.json({ message: 'Logged out successfully' });
  } catch (error) { next(error); }
}

module.exports = { register, login, refresh, logout };

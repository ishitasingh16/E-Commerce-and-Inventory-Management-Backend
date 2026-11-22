const jwt = require('jsonwebtoken');

function accessOptions() {
  return { expiresIn: '15m' };
}

function refreshOptions() {
  return { expiresIn: '7d' };
}

function signAccessToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_ACCESS_SECRET, accessOptions());
}

function signRefreshToken(user) {
  return jwt.sign({ sub: user._id.toString(), type: 'refresh' }, process.env.JWT_REFRESH_SECRET, refreshOptions());
}

module.exports = { signAccessToken, signRefreshToken };

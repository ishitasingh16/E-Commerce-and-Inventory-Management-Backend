const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_ORIGIN || '*', credentials: true } });
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid or expired access token'));
    }
  });
  io.on('connection', socket => {
    socket.join(`user:${socket.user._id}`);
    if (socket.user.role === 'admin') socket.join('admin');
    if (socket.user.role === 'seller') socket.join(`seller:${socket.user._id}`);
  });
  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

module.exports = { initSocket, getIO };

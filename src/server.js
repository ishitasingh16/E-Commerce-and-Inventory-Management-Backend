require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./sockets/socket');
const orderEvents = require('./events/orderEvents');

const PORT = Number(process.env.PORT) || 5000;

async function start() {
  await connectDB();
  const server = http.createServer(app);
  const io = initSocket(server);

  orderEvents.on('order.placed', ({ order }) => {
    io.to(`user:${order.customer}`).emit('order:new', { orderId: order._id, status: order.orderStatus, totalAmount: order.totalAmount });
    const sellerIds = [...new Set(order.items.map(item => item.seller.toString()))];
    sellerIds.forEach(id => io.to(`seller:${id}`).emit('order:new', { orderId: order._id, status: order.orderStatus }));
    io.to('admin').emit('order:new', { orderId: order._id, status: order.orderStatus });
  });
  orderEvents.on('order.status_updated', ({ order, userId }) => {
    io.to(`user:${userId}`).emit('order:status_updated', { orderId: order._id, status: order.orderStatus });
  });
  orderEvents.on('stock.low', ({ product, sellerId }) => {
    const payload = { productId: product._id, title: product.title, stock: product.stock, threshold: product.lowStockThreshold };
    io.to(`seller:${sellerId}`).emit('stock:low', payload);
    io.to('admin').emit('stock:low', payload);
  });

  server.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
}

start().catch(error => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});

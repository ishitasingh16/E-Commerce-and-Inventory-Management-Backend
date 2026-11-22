const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const orderEvents = require('../events/orderEvents');

async function checkout(req, res, next) {
  try {
    if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can place orders' });
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    const snapshots = [];
    for (const item of cart.items) {
      const product = await Product.findOne({ _id: item.product._id, isActive: true });
      if (!product) return res.status(404).json({ error: `Product ${item.product.title} not found or inactive` });
      if (item.quantity > product.stock) return res.status(400).json({ error: 'Insufficient stock', productId: product._id, available: product.stock });
      snapshots.push({
        product: product._id,
        titleSnapshot: product.title,
        priceSnapshot: product.price,
        quantity: item.quantity,
        seller: product.seller
      });
    }

    const decremented = [];
    for (const item of snapshots) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, isActive: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) {
        for (const prior of decremented) {
          await Product.findByIdAndUpdate(prior.product, { $inc: { stock: prior.quantity } });
        }
        return res.status(409).json({ error: 'Insufficient stock during checkout; inventory unchanged for previous items' });
      }
      decremented.push(item);
    }

    const totalAmount = Number(snapshots.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0).toFixed(2));
    let order;
    try {
      order = await Order.create({
        customer: req.user._id,
        items: snapshots,
        totalAmount,
        paymentStatus: 'simulated_paid',
        orderStatus: 'pending'
      });
    } catch (error) {
      for (const prior of decremented) {
        await Product.findByIdAndUpdate(prior.product, { $inc: { stock: prior.quantity } });
      }
      throw error;
    }
    cart.items = [];
    await cart.save();

    for (const item of snapshots) {
      const product = await Product.findById(item.product);
      if (product && product.stock <= product.lowStockThreshold) orderEvents.emit('stock.low', { product, sellerId: item.seller });
    }
    orderEvents.emit('order.placed', { order });
    res.status(201).json({ message: 'Simulated payment successful', order });
  } catch (error) { next(error); }
}

async function listOrders(req, res) {
  const filter = {};
  if (req.user.role === 'customer') filter.customer = req.user._id;
  if (req.user.role === 'seller') filter['items.seller'] = req.user._id;
  const orders = await Order.find(filter).populate('customer', 'name email').populate('items.product', 'title').sort({ createdAt: -1 });
  res.json({ orders });
}

async function getOrder(req, res) {
  const order = await Order.findById(req.params.id).populate('customer', 'name email').populate('items.product', 'title');
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const ownsSellerItem = order.items.some(item => item.seller.toString() === req.user._id.toString());
  if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) return res.status(403).json({ error: 'Forbidden' });
  if (req.user.role === 'seller' && !ownsSellerItem) return res.status(403).json({ error: 'Forbidden' });
  res.json({ order });
}

const transitions = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

async function updateStatus(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (!req.body.orderStatus) return res.status(400).json({ error: 'orderStatus is required' });
    if (!['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].includes(req.body.orderStatus)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }
    const ownsSellerItem = order.items.some(item => item.seller.toString() === req.user._id.toString());
    if (req.user.role === 'customer') return res.status(403).json({ error: 'Customers cannot change order status' });
    if (req.user.role === 'seller' && !ownsSellerItem) return res.status(403).json({ error: 'Forbidden: order has no item sold by you' });

    const allowed = transitions[order.orderStatus] || [];
    if (!allowed.includes(req.body.orderStatus)) {
      return res.status(400).json({ error: `Invalid transition: ${order.orderStatus} -> ${req.body.orderStatus}` });
    }

    if (req.body.orderStatus === 'cancelled' && order.orderStatus !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity } });
      }
    }
    order.orderStatus = req.body.orderStatus;
    await order.save();
    orderEvents.emit('order.status_updated', { order, userId: order.customer });
    res.json({ order });
  } catch (error) { next(error); }
}

module.exports = { checkout, listOrders, getOrder, updateStatus };

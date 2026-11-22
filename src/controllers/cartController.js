const Cart = require('../models/Cart');
const Product = require('../models/Product');

async function customerCart(req, res, next) {
  try {
    if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can manage carts' });
    next();
  } catch (error) { next(error); }
}

async function getCart(req, res) {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  await cart.populate('items.product');
  const items = cart.items.map(item => ({
    product: item.product,
    quantity: item.quantity,
    lineTotal: item.product ? Number((item.product.price * item.quantity).toFixed(2)) : 0
  }));
  const totalAmount = Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  res.json({ cart: { id: cart._id, items, totalAmount } });
}

async function addItem(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId is required' });
    if (!Number.isInteger(Number(quantity)) || Number(quantity) < 1) return res.status(400).json({ error: 'quantity must be a positive integer' });
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) return res.status(404).json({ error: 'Product not found or inactive' });
    let cart = await Cart.findOne({ user: req.user._id }) || await Cart.create({ user: req.user._id, items: [] });
    const existing = cart.items.find(item => item.product.toString() === productId);
    const desired = existing ? existing.quantity + Number(quantity) : Number(quantity);
    if (desired > product.stock) return res.status(400).json({ error: 'Insufficient stock', available: product.stock });
    if (existing) existing.quantity = desired; else cart.items.push({ product: productId, quantity: desired });
    await cart.save();
    await cart.populate('items.product');
    res.status(201).json({ cart });
  } catch (error) { next(error); }
}

async function updateItem(req, res, next) {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return res.status(400).json({ error: 'quantity must be a positive integer' });
    const product = await Product.findOne({ _id: req.params.productId, isActive: true });
    if (!product) return res.status(404).json({ error: 'Product not found or inactive' });
    if (quantity > product.stock) return res.status(400).json({ error: 'Insufficient stock', available: product.stock });
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    const item = cart.items.find(i => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ error: 'Cart item not found' });
    item.quantity = quantity;
    await cart.save();
    res.json({ cart: await cart.populate('items.product') });
  } catch (error) { next(error); }
}

async function removeItem(req, res) {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  const before = cart.items.length;
  cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
  if (cart.items.length === before) return res.status(404).json({ error: 'Cart item not found' });
  await cart.save();
  res.json({ cart: await cart.populate('items.product') });
}

module.exports = { customerCart, getCart, addItem, updateItem, removeItem };

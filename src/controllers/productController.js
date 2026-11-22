const Product = require('../models/Product');
const Category = require('../models/Category');

async function listProducts(req, res) {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
  const filter = { isActive: true };
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.seller) filter.seller = req.query.seller;
  if (req.query.minPrice || req.query.maxPrice) {
    filter.price = {};
    if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
    if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
  }
  const sortMap = { priceAsc: { price: 1 }, priceDesc: { price: -1 }, newest: { createdAt: -1 } };
  const sort = sortMap[req.query.sort] || { createdAt: -1 };
  const [products, total] = await Promise.all([
    Product.find(filter).populate('category', 'name slug').populate('seller', 'name').skip((page - 1) * limit).limit(limit).sort(sort),
    Product.countDocuments(filter)
  ]);
  res.json({ products, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

async function getProduct(req, res) {
  const product = await Product.findById(req.params.id).populate('category', 'name slug').populate('seller', 'name email');
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ product });
}

async function createProduct(req, res, next) {
  try {
    const { title, description, price, category, stock, lowStockThreshold, isActive } = req.body;
    if (!title || price === undefined || !category) return res.status(400).json({ error: 'title, price and category are required' });
    if (!await Category.findById(category)) return res.status(404).json({ error: 'Category not found' });
    const seller = req.user.role === 'admin' && req.body.seller ? req.body.seller : req.user._id;
    const product = await Product.create({ title, description, price, category, seller, stock, lowStockThreshold, isActive });
    res.status(201).json({ product });
  } catch (error) { next(error); }
}

async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the product owner or admin may update it' });
    }
    if (req.body.category && !await Category.findById(req.body.category)) return res.status(404).json({ error: 'Category not found' });
    const allowed = ['title', 'description', 'price', 'category', 'stock', 'lowStockThreshold', 'isActive'];
    allowed.forEach(field => { if (req.body[field] !== undefined) product[field] = req.body[field]; });
    await product.save();
    res.json({ product });
  } catch (error) { next(error); }
}

async function deleteProduct(req, res) {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (req.user.role !== 'admin' && product.seller.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Only the product owner or admin may delete it' });
  }
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: 'Product deleted' });
}
module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };

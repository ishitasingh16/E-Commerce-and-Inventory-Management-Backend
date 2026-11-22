const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, required: true, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stock: { type: Number, required: true, min: 0, default: 0 },
  lowStockThreshold: { type: Number, required: true, min: 0, default: 5 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

productSchema.index({ category: 1, price: 1 });
productSchema.index({ seller: 1, title: 1 });

module.exports = mongoose.model('Product', productSchema);

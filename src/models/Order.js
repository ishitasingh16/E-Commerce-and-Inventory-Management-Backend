const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    titleSnapshot: { type: String, required: true },
    priceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  paymentStatus: { type: String, enum: ['simulated_paid', 'simulated_failed'], default: 'simulated_paid' },
  orderStatus: { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending', index: true }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');
const Cart = require('../src/models/Cart');
const Order = require('../src/models/Order');

async function seed() {
  await connectDB();
  await Promise.all([
    Order.deleteMany({}), Cart.deleteMany({}), Product.deleteMany({}),
    Category.deleteMany({}), User.deleteMany({})
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 12);
  const [admin, seller, customer] = await User.create([
    { name: 'Admin User', email: 'admin@example.com', passwordHash, role: 'admin' },
    { name: 'Sample Seller', email: 'seller@example.com', passwordHash, role: 'seller' },
    { name: 'Sample Customer', email: 'customer@example.com', passwordHash, role: 'customer' }
  ]);

  const categories = await Category.create([
    { name: 'Electronics', slug: 'electronics', description: 'Phones, laptops and accessories' },
    { name: 'Books', slug: 'books', description: 'Printed and digital books' },
    { name: 'Home', slug: 'home', description: 'Home and kitchen goods' }
  ]);

  const products = await Product.create([
    { title: 'Wireless Headphones', description: 'Noise-cancelling Bluetooth headphones', price: 2499, category: categories[0]._id, seller: seller._id, stock: 12, lowStockThreshold: 3 },
    { title: 'Programming Handbook', description: 'A practical software engineering handbook', price: 799, category: categories[1]._id, seller: seller._id, stock: 2, lowStockThreshold: 4 },
    { title: 'Ceramic Coffee Mug', description: '350 ml glazed ceramic mug', price: 399, category: categories[2]._id, seller: seller._id, stock: 20, lowStockThreshold: 5 }
  ]);

  await Cart.create({
    user: customer._id,
    items: [{ product: products[0]._id, quantity: 1 }, { product: products[2]._id, quantity: 2 }]
  });

  await Order.create([
    {
      customer: customer._id,
      items: [{ product: products[0]._id, titleSnapshot: products[0].title, priceSnapshot: products[0].price, quantity: 1, seller: seller._id }],
      totalAmount: products[0].price,
      paymentStatus: 'simulated_paid',
      orderStatus: 'pending'
    },
    {
      customer: customer._id,
      items: [{ product: products[1]._id, titleSnapshot: products[1].title, priceSnapshot: products[1].price, quantity: 2, seller: seller._id }],
      totalAmount: products[1].price * 2,
      paymentStatus: 'simulated_paid',
      orderStatus: 'delivered'
    }
  ]);

  console.log('Seed complete');
  console.log('Accounts: admin@example.com | seller@example.com | customer@example.com');
  console.log('Password for all accounts: Password123!');
  await mongoose.disconnect();
}

seed().catch(async error => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});

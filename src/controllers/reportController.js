const Order = require('../models/Order');
const Product = require('../models/Product');

async function salesSummary(req, res) {
  const pipeline = [
    { $unwind: '$items' },
    { $lookup: { from: 'categories', localField: 'items.category', foreignField: '_id', as: 'categoryData' } },
    { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'productData' } },
    { $set: { categoryRef: { $arrayElemAt: ['$productData.category', 0] } } },
    { $lookup: { from: 'categories', localField: 'categoryRef', foreignField: '_id', as: 'categoryData' } },
    { $unwind: { path: '$categoryData', preserveNullAndEmptyArrays: true } },
    { $group: {
      _id: { categoryId: '$categoryData._id', category: '$categoryData.name', orderStatus: '$orderStatus' },
      revenue: { $sum: { $multiply: ['$items.priceSnapshot', '$items.quantity'] } },
      unitsSold: { $sum: '$items.quantity' },
      orders: { $addToSet: '$_id' }
    }},
    { $project: { _id: 0, categoryId: '$_id.categoryId', category: '$_id.category', orderStatus: '$_id.orderStatus', revenue: 1, unitsSold: 1, orderCount: { $size: '$orders' } } },
    { $sort: { category: 1, orderStatus: 1 } }
  ];
  res.json({ report: 'sales-and-revenue-by-category-and-status', results: await Order.aggregate(pipeline) });
}

async function productsAndInventory(req, res) {
  const [bestSelling, lowStock] = await Promise.all([
    Order.aggregate([
      { $unwind: '$items' },
      { $match: { paymentStatus: 'simulated_paid', orderStatus: { $ne: 'cancelled' } } },
      { $group: { _id: '$items.product', title: { $first: '$items.titleSnapshot' }, unitsSold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.priceSnapshot', '$items.quantity'] } } } },
      { $sort: { unitsSold: -1 } },
      { $limit: 20 }
    ]),
    Product.aggregate([
      { $match: { isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } } },
      { $lookup: { from: 'users', localField: 'seller', foreignField: '_id', as: 'sellerData' } },
      { $project: { title: 1, stock: 1, lowStockThreshold: 1, seller: { $arrayElemAt: ['$sellerData.name', 0] } } },
      { $sort: { stock: 1 } }
    ])
  ]);
  res.json({ report: 'best-selling-products-and-low-stock-inventory', bestSelling, lowStock });
}

module.exports = { salesSummary, productsAndInventory };

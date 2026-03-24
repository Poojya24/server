const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');

// @desc    Get dashboard summary stats
// @route   GET /api/stats/summary
// @access  Private
const getSummaryStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const categoriesCount = (await Product.distinct('category')).length;
    
    const lowStockCount = await Product.countDocuments({ status: 'Low stock' });
    const outOfStockCount = await Product.countDocuments({ status: 'Out of stock' });

    // Total Revenue (from paid invoices)
    const revenueData = await Invoice.aggregate([
      { $match: { user: req.user._id, status: 'Paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueData[0] ? revenueData[0].total : 0;

    // Total Sales count
    const salesCount = await Transaction.countDocuments({ user: req.user._id, type: 'Sale' });
    
    // Total Purchase value (Mocking or using Purchase transactions if implemented)
    const purchaseData = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'Purchase' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalPurchaseValue = purchaseData[0] ? purchaseData[0].total : 0;
    const purchaseCount = purchaseData[0] ? purchaseData[0].count : 0;

    // Products Sold (Sum of quantities in Sale transactions)
    const productsSoldData = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'Sale' } },
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const productsSold = productsSoldData[0] ? productsSoldData[0].total : 0;

    // Products in Stock (Sum of quantities of all products)
    const productsInStockData = await Product.aggregate([
      { $group: { _id: null, total: { $sum: '$quantity' } } }
    ]);
    const productsInStock = productsInStockData[0] ? productsInStockData[0].total : 0;

    res.json({
      salesOverview: {
        totalSalesValue: totalRevenue, // Assuming paid invoices = sales value
        salesCount: salesCount
      },
      purchaseOverview: {
        totalPurchaseValue,
        purchaseCount
      },
      inventorySummary: {
        totalItemsInStock: productsInStock,
        lowStockCount: lowStockCount + outOfStockCount
      },
      productSummary: {
        totalProducts,
        categoriesCount
      },
      topStatisticCards: {
        totalRevenue,
        productsSold,
        productsInStock
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Sales vs Purchase Graph Data
// @route   GET /api/stats/graph
// @access  Private
const getGraphData = async (req, res) => {
  try {
    // Group transactions by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const graphData = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          sales: {
            $sum: { $cond: [{ $eq: ["$type", "Sale"] }, "$amount", 0] }
          },
          purchases: {
            $sum: { $cond: [{ $eq: ["$type", "Purchase"] }, "$amount", 0] }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    res.json(graphData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Top Selling Products
// @route   GET /api/stats/top-selling
// @access  Private
const getTopSellingProducts = async (req, res) => {
  try {
    const topSelling = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'Sale' } },
      {
        $group: {
          _id: "$product",
          totalSold: { $sum: "$quantity" }
        }
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" }
    ]);

    res.json(topSelling);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSummaryStats,
  getGraphData,
  getTopSellingProducts,
};

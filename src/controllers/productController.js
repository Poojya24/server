const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const csv = require('csv-parser');
const fs = require('fs');
const asyncHandler = require('../middleware/errorMiddleware');

// @desc    Get all products (paginated + search)
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const pageSize = Number(req.query.pageSize) || 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { productId: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const count = await Product.countDocuments({ ...keyword });
  const products = await Product.find({ ...keyword })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({ products, page, pages: Math.ceil(count / pageSize), total: count });
});

const getInventorySummary = asyncHandler(async (req, res) => {
  const totalProducts = await Product.countDocuments();
  const categories = await Product.distinct('category');
  const lowStockCount = await Product.countDocuments({ status: 'Low stock' });
  const outOfStockCount = await Product.countDocuments({ status: 'Out of stock' });

  const quantitySummary = await Product.aggregate([
    {
      $group: {
        _id: null,
        totalQuantity: { $sum: '$quantity' },
        totalValue: { $sum: { $multiply: ['$price', '$quantity'] } },
      },
    },
  ]);

  const topSelling = await Transaction.aggregate([
    { $match: { type: 'Sale', user: req.user._id } },
    {
      $group: {
        _id: '$product',
        totalSold: { $sum: '$quantity' },
        totalRevenue: { $sum: '$amount' },
      },
    },
    { $sort: { totalSold: -1 } },
    { $limit: 1 },
  ]);

  res.json({
    categoriesCount: categories.length,
    totalProducts,
    totalQuantity: quantitySummary[0]?.totalQuantity || 0,
    totalValue: quantitySummary[0]?.totalValue || 0,
    topSellingCount: topSelling[0]?.totalSold || 0,
    topSellingValue: topSelling[0]?.totalRevenue || 0,
    lowStockCount,
    outOfStockCount,
  });
});

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// @desc    Create a product
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    productId,
    category,
    price,
    quantity,
    unit,
    expiryDate,
    thresholdValue,
    image,
  } = req.body;

  const productExists = await Product.findOne({ productId });

  if (productExists) {
    return res.status(400).json({ message: 'Product ID already exists' });
  }

  const product = new Product({
    name,
    productId,
    category,
    price,
    quantity,
    unit,
    expiryDate,
    thresholdValue,
    image: image || '',
  });

  const createdProduct = await product.save();
  res.status(201).json(createdProduct);
});

const uploadProductImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  res.status(201).json({
    message: 'Image uploaded successfully',
    image: `/uploads/${req.file.filename}`,
  });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const {
    name,
    productId,
    category,
    price,
    quantity,
    unit,
    expiryDate,
    thresholdValue,
    image,
  } = req.body;

  const product = await Product.findById(req.params.id);

  if (product) {
    product.name = name || product.name;
    product.productId = productId || product.productId;
    product.category = category || product.category;
    product.price = price || product.price;
    product.quantity = quantity !== undefined ? quantity : product.quantity;
    product.unit = unit || product.unit;
    product.expiryDate = expiryDate || product.expiryDate;
    product.thresholdValue = thresholdValue || product.thresholdValue;
    product.image = image || product.image;

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    await product.deleteOne();
    res.json({ message: 'Product removed' });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// @desc    Buy Simulation (Sale)
// @route   POST /api/products/:id/buy
// @access  Private
const buyProduct = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const product = await Product.findById(req.params.id);

  if (product) {
    if (product.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    product.quantity -= quantity;
    await product.save();

    // Generate Sale Transaction
    await Transaction.create({
      type: 'Sale',
      product: product._id,
      quantity,
      amount: product.price * quantity,
      user: req.user._id,
    });

    // Generate Invoice
    const invoiceId = `INV-${Date.now()}`;
    const referenceNumber = `REF-${Math.floor(Math.random() * 1000000)}`;
    
    await Invoice.create({
      invoiceId,
      referenceNumber,
      amount: product.price * quantity,
      status: 'Paid', // Assuming simulation buy is paid
      dueDate: new Date(),
      items: [{ product: product._id, quantity, price: product.price }],
      user: req.user._id,
    });

    res.json({ message: 'Purchase successful', product });
  } else {
    res.status(404).json({ message: 'Product not found' });
  }
});

// @desc    Bulk Upload Products via CSV
// @route   POST /api/products/upload
// @access  Private
const uploadProducts = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a CSV file' });
  }

  const products = [];
  const acceptedRows = [];
  const rejectedRows = [];
  const existingProductIds = new Set();

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', async (row) => {
      // Validate required fields
      if (!row.name || !row.productId || !row.category || !row.price || !row.quantity) {
        rejectedRows.push({ row, message: 'Missing required fields' });
      } else {
        const normalized = {
          name: row.name,
          productId: row.productId,
          category: row.category,
          price: Number(row.price),
          quantity: Number(row.quantity),
          unit: row.unit || 'pcs',
          thresholdValue: Number(row.thresholdValue) || 10,
          expiryDate: row.expiryDate ? new Date(row.expiryDate) : null,
        };

        if (existingProductIds.has(normalized.productId)) {
          rejectedRows.push({ row, message: `Duplicate Product ID in CSV: ${normalized.productId}` });
          return;
        }

        existingProductIds.add(normalized.productId);
        products.push(normalized);
      }
    })
    .on('end', async () => {
      try {
        if (products.length > 0) {
          // Check for duplicate product IDs within the CSV or database
          for (const p of products) {
            const existing = await Product.findOne({ productId: p.productId });
            if (existing) {
              rejectedRows.push({ row: p, message: `Duplicate Product ID: ${p.productId}` });
              continue;
            }
            const created = await Product.create(p);
            acceptedRows.push(created);
          }
        }

        fs.unlinkSync(req.file.path); // Delete file after processing

        if (rejectedRows.length > 0 && acceptedRows.length === 0) {
          return res.status(400).json({
            message: 'Bulk upload failed',
            acceptedRows,
            rejectedRows,
            count: 0,
          });
        }

        res.json({
          message: 'Bulk upload completed',
          count: acceptedRows.length,
          acceptedRows,
          rejectedRows,
        });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    });
});

module.exports = {
  getProducts,
  getInventorySummary,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  buyProduct,
  uploadProductImage,
  uploadProducts,
};

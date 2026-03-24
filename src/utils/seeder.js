const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const Invoice = require('../models/Invoice');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Product.deleteMany();
    await Transaction.deleteMany();
    await Invoice.deleteMany();

    // 1. Create User
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    const user = await User.create({
      name: 'Test Admin',
      email: 'admin@example.com',
      password: hashedPassword,
    });

    // 2. Create Products
    const productsData = [
      { name: 'Maggi', productId: 'P-001', category: 'Instant Food', price: 430, quantity: 43, unit: 'Packets', thresholdValue: 12, expiryDate: new Date('2025-12-11'), status: 'In stock' },
      { name: 'Bru', productId: 'P-002', category: 'Beverages', price: 257, quantity: 1, unit: 'gm', thresholdValue: 5, expiryDate: new Date('2025-12-21'), status: 'Out of stock' },
      { name: 'Red Bull', productId: 'P-003', category: 'Beverages', price: 405, quantity: 36, unit: 'L', thresholdValue: 9, expiryDate: new Date('2025-12-05'), status: 'In stock' },
      { name: 'Bourn Vita', productId: 'P-004', category: 'Health Drink', price: 502, quantity: 0, unit: 'mg', thresholdValue: 6, expiryDate: new Date('2025-12-08'), status: 'Out of stock' },
      { name: 'Horlicks', productId: 'P-005', category: 'Health Drink', price: 530, quantity: 5, unit: 'Kg', thresholdValue: 5, expiryDate: new Date('2025-01-09'), status: 'In stock' },
      { name: 'Harpic', productId: 'P-006', category: 'Cleaning', price: 605, quantity: 10, unit: 'ml', thresholdValue: 5, expiryDate: new Date('2025-01-09'), status: 'In stock' },
      { name: 'Ariel', productId: 'P-007', category: 'Cleaning', price: 408, quantity: 23, unit: 'L', thresholdValue: 7, expiryDate: new Date('2025-12-15'), status: 'Out of stock' },
      { name: 'Scotch Brite', productId: 'P-008', category: 'Cleaning', price: 359, quantity: 43, unit: 'Packets', thresholdValue: 8, expiryDate: new Date('2025-06-06'), status: 'In stock' },
      { name: 'Coca cola', productId: 'P-009', category: 'Beverages', price: 205, quantity: 41, unit: 'ml', thresholdValue: 10, expiryDate: new Date('2025-11-11'), status: 'Low stock' },
    ];

    const createdProducts = await Product.insertMany(productsData);

    // 3. Create Transactions & Invoices (Last 7 days)
    const transactions = [];
    const invoices = [];
    const now = new Date();

    for (let i = 0; i < 20; i++) {
      const date = new Date();
      date.setDate(now.getDate() - Math.floor(Math.random() * 10)); // Random date in last 10 days
      
      const product = createdProducts[Math.floor(Math.random() * createdProducts.length)];
      const type = Math.random() > 0.3 ? 'Sale' : 'Purchase';
      const quantity = Math.floor(Math.random() * 5) + 1;
      const amount = product.price * quantity;

      transactions.push({
        type,
        product: product._id,
        quantity,
        amount,
        date,
        user: user._id
      });

      if (type === 'Sale') {
        invoices.push({
          invoiceId: `INV-${1000 + i}`,
          referenceNumber: `REF-${Math.floor(Math.random() * 1000000)}`,
          amount,
          status: Math.random() > 0.2 ? 'Paid' : 'Unpaid',
          dueDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
          items: [{ product: product._id, quantity, price: product.price }],
          user: user._id,
          createdAt: date
        });
      }
    }

    await Transaction.insertMany(transactions);
    await Invoice.insertMany(invoices);

    console.log('Data Seeded Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

connectDB().then(seedData);

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const connectDB = require('../config/db');
const productRoutes = require('../routes/productRoutes');
const userRoutes = require('../routes/userRoutes');
const Product = require('../models/Product');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

app.use((err, req, res, next) => {
    console.error('TEST APP ERROR:', err.message);
    res.status(500).json({ message: err.message, stack: err.stack });
});

beforeAll(async () => {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/inventory-test-products';
  process.env.JWT_SECRET = 'testsecret';
  await connectDB();
});

afterAll(async () => {
  await Product.deleteMany();
  await User.deleteMany();
  await mongoose.connection.close();
});

describe('Product Endpoints', () => {
  let productId;
  let token;

  beforeAll(async () => {
      // Register and login to get token
      await request(app)
        .post('/api/users/register')
        .send({ name: 'Admin', email: 'admin@test.com', password: 'password' });
      
      const res = await request(app)
        .post('/api/users/login')
        .send({ email: 'admin@test.com', password: 'password' });
      
      token = res.body.token;
  });

  it('should create a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Product',
        productId: 'TP001',
        category: 'Test',
        price: 100,
        quantity: 10,
        unit: 'pcs',
        thresholdValue: 2
      });
    if (res.statusCode !== 201) {
      console.log('Create Product Error:', res.body);
    }
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toEqual('Test Product');
    productId = res.body._id;
  });

  it('should get all products', async () => {
    const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('should perform buy simulation', async () => {
    const res = await request(app)
      .post(`/api/products/${productId}/buy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 2 });
    
    if (res.statusCode !== 200) {
        console.log('Buy Simulation Error:', res.body);
    }
    expect(res.statusCode).toEqual(200);
    expect(res.body.product.quantity).toEqual(8);
  });

  it('should mark as Low Stock if quantity drops below threshold', async () => {
     await request(app)
      .post(`/api/products/${productId}/buy`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 6 });
     
     const res = await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${token}`);
        
     expect(res.body.quantity).toEqual(2);
     expect(res.body.status).toEqual('Low stock');
  });
});

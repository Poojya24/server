const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const connectDB = require('../config/db');
const userRoutes = require('../routes/userRoutes');
const User = require('../models/User');

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

beforeAll(async () => {
  // Use a separate test database
  process.env.MONGODB_URI = 'mongodb://localhost:27017/inventory-test';
  process.env.JWT_SECRET = 'testsecret';
  await connectDB();
});

afterAll(async () => {
  await User.deleteMany();
  await mongoose.connection.close();
});

describe('Auth Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/users/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
    if (res.statusCode !== 201) {
      console.log('Register Error:', res.body);
    }
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should fail with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });
    expect(res.statusCode).toEqual(401);
  });
});

const mongoose = require('mongoose');

const productSchema = mongoose.Schema(
  {
    image: {
      type: String,
      default: 'no-image.jpg',
    },
    name: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
    },
    thresholdValue: {
      type: Number,
      required: true,
      default: 10,
    },
    status: {
      type: String,
      enum: ['In stock', 'Low stock', 'Out of stock'],
      default: 'In stock',
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to update status based on quantity and threshold
productSchema.pre('save', function () {
  if (this.quantity === 0) {
    this.status = 'Out of stock';
  } else if (this.quantity <= this.thresholdValue) {
    this.status = 'Low stock';
  } else {
    this.status = 'In stock';
  }
});

module.exports = mongoose.model('Product', productSchema);

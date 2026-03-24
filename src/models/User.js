const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      default: '',
    },
    lastName: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    statisticsLayout: {
      type: Array,
      default: [
        { id: 'total-revenue', position: 0 },
        { id: 'products-sold', position: 1 },
        { id: 'products-in-stock', position: 2 },
      ],
    },
    isTest: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.firstName && this.name) {
    const [firstName, ...rest] = this.name.split(' ');
    this.firstName = firstName || '';
    this.lastName = rest.join(' ');
  }

  this.name = `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.name;

  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('../middleware/errorMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, firstName, lastName, email, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const user = await User.create({
    firstName: firstName || name?.split(' ')[0] || '',
    lastName: lastName || name?.split(' ').slice(1).join(' ') || '',
    name: name || `${firstName || ''} ${lastName || ''}`.trim(),
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      statisticsLayout: user.statisticsLayout,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      statisticsLayout: user.statisticsLayout,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    res.json({
      _id: user._id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      profileImage: user.profileImage,
      statisticsLayout: user.statisticsLayout,
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.name = req.body.name || `${user.firstName} ${user.lastName}`.trim() || user.name;
    // Email is immutable from settings as per requirement
    if (req.body.password) {
      user.password = req.body.password;
    }
    if (req.body.profileImage) {
      user.profileImage = req.body.profileImage;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      profileImage: updatedUser.profileImage,
      statisticsLayout: updatedUser.statisticsLayout,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Update statistics layout
// @route   PUT /api/users/layout
// @access  Private
const updateLayout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.statisticsLayout = req.body.layout || user.statisticsLayout;
    await user.save();
    res.json({ message: 'Layout updated successfully', layout: user.statisticsLayout });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc    Forgot Password Mock
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User with this email does not exist' });
  }

  // In a real app, send email here. For now, mock success.
  res.json({ message: 'Reset link sent to registered email' });
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateLayout,
  forgotPassword,
};


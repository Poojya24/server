const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateLayout,
  forgotPassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  console.log("OTP:", otp); // 👈 you will see in terminal

  res.json({
    message: "OTP sent",
    otp: otp // 🔥 THIS WAS MISSING
  });
});
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.route('/layout').put(protect, updateLayout);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getSummaryStats,
  getGraphData,
  getTopSellingProducts,
} = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/summary', protect, getSummaryStats);
router.get('/graph', protect, getGraphData);
router.get('/top-selling', protect, getTopSellingProducts);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoiceById,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoiceStats,
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getInvoices);
router.get('/stats', protect, getInvoiceStats);
router
  .route('/:id')
  .get(protect, getInvoiceById)
  .delete(protect, deleteInvoice);
router.put('/:id/status', protect, updateInvoiceStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getProducts,
  getInventorySummary,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  buyProduct,
  uploadProductImage,
  uploadProducts,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/fileUpload');

router.route('/').get(protect, getProducts).post(protect, createProduct);
router.get('/summary', protect, getInventorySummary);
router.post('/image-upload', protect, upload.single('image'), uploadProductImage);
router.post('/upload', protect, upload.single('file'), uploadProducts);
router
  .route('/:id')
  .get(protect, getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);
router.post('/:id/buy', protect, buyProduct);

module.exports = router;

const cron = require('node-cron');
const Product = require('../models/Product');

const initCronJobs = () => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    console.log('Running Out-of-Stock Check Cron Job...');
    try {
      const products = await Product.find({ quantity: 0, status: { $ne: 'Out of stock' } });
      
      for (const product of products) {
        product.status = 'Out of stock';
        await product.save();
        console.log(`Updated product ${product.productId} to Out of stock`);
      }
      
      console.log('Cron Job Completed.');
    } catch (error) {
      console.error('Error in Cron Job:', error.message);
    }
  });
};

module.exports = initCronJobs;

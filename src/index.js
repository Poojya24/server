const app = require('./app');
const initCronJobs = require('./utils/cronJobs');

// Initialize Cron Jobs
initCronJobs();

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

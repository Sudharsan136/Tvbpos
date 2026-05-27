const express = require('express');
const router = express.Router();
const {
  getSalesSummary,
  getItemPerformance,
  getPaymentPerformance,
  getSourcePerformance,
  getTablePerformance,
  getHourlyPerformance,
  getRawOrders,
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Apply protection and admin-only rules to all reports
router.use(protect);
router.use(adminOnly);

router.get('/sales-summary', getSalesSummary);
router.get('/items', getItemPerformance);
router.get('/payments', getPaymentPerformance);
router.get('/sources', getSourcePerformance);
router.get('/tables', getTablePerformance);
router.get('/hourly', getHourlyPerformance);
router.get('/raw-orders', getRawOrders);

module.exports = router;

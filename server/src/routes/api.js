const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const tableRoutes = require('./tableRoutes');
const itemRoutes = require('./itemRoutes');
const orderRoutes = require('./orderRoutes');
const customerRoutes = require('./customerRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const reportRoutes = require('./reportRoutes');

router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/items', itemRoutes);
router.use('/orders', orderRoutes);
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/reports', reportRoutes);

// Webhook stub for future Swiggy/Zomato integration
router.post('/webhooks/swiggy', (req, res) => {
  console.log('📦 Swiggy Webhook received:', req.body);
  res.json({ received: true });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  getOrders, getOrder, createOrder,
  updateOrderItems, applyDiscount,
  fireKOT, generateBill, recordPayment, cancelOrder,
  receiveOnlineOrder
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

// Webhook for Swiggy/Zomato (No auth middleware because it's a public webhook)
router.post('/webhook/online', receiveOnlineOrder);

router.get('/', protect, getOrders);
router.post('/', protect, createOrder);
router.get('/:id', protect, getOrder);
router.patch('/:id/items', protect, updateOrderItems);
router.patch('/:id/discount', protect, updateOrderItems);
router.post('/:id/kot', protect, fireKOT);
router.post('/:id/bill', protect, generateBill);
router.post('/:id/pay', protect, recordPayment);
router.patch('/:id/cancel', protect, adminOnly, cancelOrder);

module.exports = router;

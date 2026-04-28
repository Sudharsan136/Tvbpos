const express = require('express');
const router = express.Router();
const { getCustomers, createCustomer, getCustomerOrders } = require('../controllers/customerController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getCustomers);
router.post('/', protect, createCustomer);
router.get('/:id/orders', protect, getCustomerOrders);

module.exports = router;

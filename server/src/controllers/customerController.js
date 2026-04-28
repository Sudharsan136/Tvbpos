const asyncHandler = require('express-async-handler');
const Customer = require('../models/Customer');
const Order = require('../models/Order');

// @desc  Get all customers
// @route GET /api/customers
const getCustomers = asyncHandler(async (req, res) => {
  const search = req.query.search;
  const filter = search
    ? { $or: [{ name: new RegExp(search, 'i') }, { phone: new RegExp(search, 'i') }] }
    : {};
  const customers = await Customer.find(filter).sort({ name: 1 }).limit(50);
  res.json(customers);
});

// @desc  Create customer
// @route POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const { phone } = req.body;
  const exists = await Customer.findOne({ phone });
  if (exists) return res.json(exists); // return existing customer silently
  const customer = await Customer.create(req.body);
  res.status(201).json(customer);
});

// @desc  Get customer bill history
// @route GET /api/customers/:id/orders
const getCustomerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customer: req.params.id, status: { $in: ['billed', 'paid'] } })
    .sort({ createdAt: -1 })
    .populate('table', 'number name');
  res.json(orders);
});

module.exports = { getCustomers, createCustomer, getCustomerOrders };

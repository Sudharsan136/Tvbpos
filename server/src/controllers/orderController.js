const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const KOT = require('../models/KOT');
const Table = require('../models/Table');
const { calcBillTotals } = require('../utils/taxCalculator');

let kotCounter = 1;
const generateKotNumber = async () => {
  const count = await KOT.countDocuments();
  return `KOT-${String(count + 1).padStart(4, '0')}`;
};

const generateBillNumber = async () => {
  const count = await Order.countDocuments({ billNumber: { $exists: true } });
  const date = new Date();
  const prefix = `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
  return `${prefix}-${String(count + 1).padStart(4, '0')}`;
};

// @desc  Get all orders
// @route GET /api/orders
const getOrders = asyncHandler(async (req, res) => {
  const { status, date } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    filter.createdAt = { $gte: start, $lt: end };
  }
  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate('table', 'number name')
    .populate('customer', 'name phone')
    .populate('createdBy', 'name')
    .limit(100);
  res.json(orders);
});

// @desc  Get single order
// @route GET /api/orders/:id
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('table', 'number name')
    .populate('customer', 'name phone gstin address')
    .populate('kots')
    .populate('createdBy', 'name');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  res.json(order);
});

// @desc  Create new order (open table)
// @route POST /api/orders
const createOrder = asyncHandler(async (req, res) => {
  const { tableId, customerId, items } = req.body;

  const table = await Table.findById(tableId);
  if (!table) { res.status(404); throw new Error('Table not found'); }
  if (table.status === 'occupied') { res.status(400); throw new Error('Table already occupied'); }

  const totals = calcBillTotals(items || []);

  const order = await Order.create({
    table: tableId,
    customer: customerId || null,
    items: items || [],
    createdBy: req.user._id,
    ...totals,
  });

  // Mark table as occupied
  table.status = 'occupied';
  table.currentOrder = order._id;
  await table.save();

  const io = req.app.get('io');
  if (io) io.emit('table_status_changed', { tableId: table._id, status: 'occupied', tableNumber: table.number });

  const populated = await Order.findById(order._id).populate('table', 'number name');
  res.status(201).json(populated);
});

// @desc  Add / update items in an order
// @route PATCH /api/orders/:id/items
const updateOrderItems = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.status !== 'open') { res.status(400); throw new Error('Cannot modify a billed/paid order'); }

  order.items = req.body.items;
  const totals = calcBillTotals(order.items, order.discountPercent);
  Object.assign(order, totals);
  await order.save();
  res.json(order);
});

// @desc  Apply discount to order
// @route PATCH /api/orders/:id/discount
const applyDiscount = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) { res.status(404); throw new Error('Order not found'); }
  order.discountPercent = req.body.discountPercent || 0;
  const totals = calcBillTotals(order.items, order.discountPercent);
  Object.assign(order, totals);
  await order.save();
  res.json(order);
});

// @desc  Fire KOT (send items to kitchen)
// @route POST /api/orders/:id/kot
const fireKOT = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('table');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  const newItems = order.items
    .filter((i) => !i.kotSent && i.qty > 0)
    .map((i) => ({
      item: i.item,
      name: i.name,
      qty: i.qty,
      notes: i.notes,
      status: 'pending',
    }));

  if (!newItems.length) { res.status(400); throw new Error('No new items to send to kitchen'); }

  const kotNumber = await generateKotNumber();
  const kot = await KOT.create({
    kotNumber,
    order: order._id,
    table: order.table._id,
    tableNumber: order.table.number,
    items: newItems,
  });

  // Mark items as kotSent
  order.items.forEach((i) => { if (!i.kotSent) i.kotSent = true; });
  order.kots.push(kot._id);
  await order.save();

  // Emit to kitchen room via Socket.io
  const io = req.app.get('io');
  if (io) {
    io.to('kitchen').emit('new_kot', {
      kotId: kot._id,
      kotNumber: kot.kotNumber,
      tableNumber: order.table.number,
      tableName: order.table.name,
      items: newItems,
      sentAt: kot.sentAt,
    });
  }

  res.status(201).json(kot);
});

// @desc  Generate bill (finalize order for payment)
// @route POST /api/orders/:id/bill
const generateBill = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('table');
  if (!order) { res.status(404); throw new Error('Order not found'); }
  if (order.status !== 'open') { res.status(400); throw new Error('Order already billed'); }

  order.billNumber = await generateBillNumber();
  order.status = 'billed';

  const totals = calcBillTotals(order.items, order.discountPercent);
  Object.assign(order, totals);
  await order.save();

  // Update table to billed
  await Table.findByIdAndUpdate(order.table._id, { status: 'billed' });
  const io = req.app.get('io');
  if (io) io.emit('table_status_changed', { tableId: order.table._id, status: 'billed', tableNumber: order.table.number });

  const populated = await Order.findById(order._id)
    .populate('table', 'number name')
    .populate('customer', 'name phone gstin address')
    .populate('kots');
  res.json(populated);
});

// @desc  Record payment and close order
// @route POST /api/orders/:id/pay
const recordPayment = asyncHandler(async (req, res) => {
  const { paymentMode, amountPaid } = req.body;
  const order = await Order.findById(req.params.id).populate('table');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.paymentMode = paymentMode;
  order.amountPaid = amountPaid;
  order.changeReturned = Math.max(0, amountPaid - order.grandTotal);
  order.status = 'paid';
  order.paidAt = new Date();
  await order.save();

  // Free up the table
  await Table.findByIdAndUpdate(order.table._id, { status: 'available', currentOrder: null });
  const io = req.app.get('io');
  if (io) io.emit('table_status_changed', { tableId: order.table._id, status: 'available', tableNumber: order.table.number });
  if (io) io.emit('order_paid', { orderId: order._id, billNumber: order.billNumber, tableNumber: order.table.number });

  res.json(order);
});

// @desc  Cancel order
// @route PATCH /api/orders/:id/cancel
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('table');
  if (!order) { res.status(404); throw new Error('Order not found'); }

  order.status = 'cancelled';
  await order.save();
  await Table.findByIdAndUpdate(order.table._id, { status: 'available', currentOrder: null });

  const io = req.app.get('io');
  if (io) io.emit('table_status_changed', { tableId: order.table._id, status: 'available', tableNumber: order.table.number });

  res.json({ message: 'Order cancelled' });
});

module.exports = {
  getOrders, getOrder, createOrder,
  updateOrderItems, applyDiscount,
  fireKOT, generateBill, recordPayment, cancelOrder,
};

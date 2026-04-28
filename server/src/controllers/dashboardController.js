const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const KOT = require('../models/KOT');

// @desc  Dashboard analytics
// @route GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Today's revenue
  const todayOrders = await Order.find({
    status: 'paid',
    paidAt: { $gte: today, $lt: tomorrow },
  });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Month revenue
  const monthOrders = await Order.find({
    status: 'paid',
    paidAt: { $gte: thisMonth },
  });
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Pending bills
  const pendingBills = await Order.countDocuments({ status: 'billed' });

  // Total customers
  const totalCustomers = await Order.distinct('customer', { customer: { $ne: null } });

  // Last 7 days revenue chart
  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayOrders = await Order.find({ status: 'paid', paidAt: { $gte: d, $lt: next } });
    const revenue = dayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
    last7.push({
      date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      revenue: parseFloat(revenue.toFixed(2)),
      orders: dayOrders.length,
    });
  }

  // Top 5 items sold today
  const paidOrders = await Order.find({ status: 'paid', paidAt: { $gte: today } });
  const itemMap = {};
  paidOrders.forEach((o) => {
    o.items.forEach((i) => {
      if (!itemMap[i.name]) itemMap[i.name] = { name: i.name, qty: 0, revenue: 0 };
      itemMap[i.name].qty += i.qty;
      itemMap[i.name].revenue += i.price * i.qty;
    });
  });
  const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Recent orders
  const recentOrders = await Order.find({ status: { $in: ['paid', 'billed'] } })
    .sort({ updatedAt: -1 })
    .limit(8)
    .populate('table', 'number name')
    .populate('customer', 'name phone');

  res.json({
    todayRevenue: parseFloat(todayRevenue.toFixed(2)),
    todayOrders: todayOrders.length,
    monthRevenue: parseFloat(monthRevenue.toFixed(2)),
    monthOrders: monthOrders.length,
    pendingBills,
    totalCustomers: totalCustomers.length,
    revenueChart: last7,
    topItems,
    recentOrders,
  });
});

// @desc  KOT stats for kitchen view
// @route GET /api/dashboard/kots
const getActiveKots = asyncHandler(async (req, res) => {
  const kots = await KOT.find({ status: { $ne: 'completed' } })
    .sort({ sentAt: 1 })
    .populate('table', 'number name');
  res.json(kots);
});

module.exports = { getDashboard, getActiveKots };

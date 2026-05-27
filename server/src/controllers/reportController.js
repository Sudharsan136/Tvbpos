const asyncHandler = require('express-async-handler');
const Order = require('../models/Order');
const Item = require('../models/Item');
const Table = require('../models/Table');

// Helper to parse date filters from query parameters
const getFilterQuery = (req) => {
  const { startDate, endDate, orderType, source, paymentMode } = req.query;
  
  // Default to today if no dates provided
  const start = startDate ? new Date(startDate) : new Date();
  if (!startDate) start.setHours(0, 0, 0, 0);
  else start.setHours(0, 0, 0, 0);

  const end = endDate ? new Date(endDate) : new Date();
  if (!endDate) end.setHours(23, 59, 59, 999);
  else end.setHours(23, 59, 59, 999);

  // We only pull paid orders for financial reports
  const query = {
    status: 'paid',
    paidAt: { $gte: start, $lte: end },
  };

  if (orderType) query.orderType = orderType;
  if (source) query.source = source;
  if (paymentMode) query.paymentMode = paymentMode;

  return { query, start, end };
};

// @desc    Get Sales Summary Report
// @route   GET /api/reports/sales-summary
const getSalesSummary = asyncHandler(async (req, res) => {
  const { query, start, end } = getFilterQuery(req);

  // Financial KPIs
  const financials = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$grandTotal' },
        totalSubtotal: { $sum: '$subtotal' },
        totalTax: { $sum: '$taxAmount' },
        totalCgst: { $sum: '$cgst' },
        totalSgst: { $sum: '$sgst' },
        totalDiscount: { $sum: '$discountAmount' },
        totalOrders: { $sum: 1 },
      },
    },
  ]);

  const kpis = financials[0] || {
    totalRevenue: 0,
    totalSubtotal: 0,
    totalTax: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalDiscount: 0,
    totalOrders: 0,
  };

  kpis.averageOrderValue = kpis.totalOrders > 0 ? parseFloat((kpis.totalRevenue / kpis.totalOrders).toFixed(2)) : 0;
  kpis.totalRevenue = parseFloat(kpis.totalRevenue.toFixed(2));
  kpis.totalSubtotal = parseFloat(kpis.totalSubtotal.toFixed(2));
  kpis.totalTax = parseFloat(kpis.totalTax.toFixed(2));
  kpis.totalCgst = parseFloat(kpis.totalCgst.toFixed(2));
  kpis.totalSgst = parseFloat(kpis.totalSgst.toFixed(2));
  kpis.totalDiscount = parseFloat(kpis.totalDiscount.toFixed(2));

  // Daily revenue trend (using timezone +05:30 for Indian Local Time)
  const dailyTrend = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt', timezone: '+05:30' } },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const chartData = dailyTrend.map(item => ({
    date: item._id,
    revenue: parseFloat(item.revenue.toFixed(2)),
    orders: item.orders,
  }));

  res.json({
    kpis,
    chartData,
    dateRange: { start, end }
  });
});

// @desc    Get Item Performance Report
// @route   GET /api/reports/items
const getItemPerformance = asyncHandler(async (req, res) => {
  const { query } = getFilterQuery(req);

  const itemStats = await Order.aggregate([
    { $match: query },
    { $unwind: '$items' },
    {
      $lookup: {
        from: 'items',
        localField: 'items.item',
        foreignField: '_id',
        as: 'itemDetails',
      },
    },
    { $unwind: { path: '$itemDetails', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$items.name',
        qty: { $sum: '$items.qty' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } },
        category: { $first: { $ifNull: ['$itemDetails.category', 'Uncategorized'] } },
        isVeg: { $first: { $ifNull: ['$itemDetails.isVeg', true] } },
      },
    },
    { $sort: { qty: -1 } },
  ]);

  const items = itemStats.map(item => ({
    name: item._id,
    qty: item.qty,
    revenue: parseFloat(item.revenue.toFixed(2)),
    category: item.category,
    isVeg: item.isVeg,
  }));

  res.json(items);
});

// @desc    Get Payment Mode Performance
// @route   GET /api/reports/payments
const getPaymentPerformance = asyncHandler(async (req, res) => {
  const { query } = getFilterQuery(req);

  const paymentStats = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: '$paymentMode',
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const payments = paymentStats.map(item => ({
    mode: item._id || 'pending',
    revenue: parseFloat(item.revenue.toFixed(2)),
    orders: item.orders,
  }));

  res.json(payments);
});

// @desc    Get Order Source & Type Performance
// @route   GET /api/reports/sources
const getSourcePerformance = asyncHandler(async (req, res) => {
  const { query } = getFilterQuery(req);

  const typeStats = await Order.aggregate([
    { $match: query },
    {
      $group: {
        _id: { orderType: '$orderType', source: '$source' },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
  ]);

  const results = typeStats.map(item => ({
    orderType: item._id.orderType,
    source: item._id.source,
    revenue: parseFloat(item.revenue.toFixed(2)),
    orders: item.orders,
  }));

  res.json(results);
});

// @desc    Get Table Performance
// @route   GET /api/reports/tables
const getTablePerformance = asyncHandler(async (req, res) => {
  const { query } = getFilterQuery(req);

  const tableStats = await Order.aggregate([
    { $match: query },
    {
      $lookup: {
        from: 'tables',
        localField: 'table',
        foreignField: '_id',
        as: 'tableDetails',
      },
    },
    { $unwind: { path: '$tableDetails', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: '$table',
        tableNumber: { $first: '$tableDetails.number' },
        tableName: { $first: '$tableDetails.name' },
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  const tables = tableStats.map(item => ({
    tableId: item._id,
    tableName: item.tableNumber ? `Table ${item.tableNumber} (${item.tableName || 'Main'})` : 'Takeaway / Delivery',
    revenue: parseFloat(item.revenue.toFixed(2)),
    orders: item.orders,
  }));

  res.json(tables);
});

// @desc    Get Hourly Sales Performance
// @route   GET /api/reports/hourly
const getHourlyPerformance = asyncHandler(async (req, res) => {
  const { query } = getFilterQuery(req);

  const hourlyStats = await Order.aggregate([
    { $match: query },
    {
      $project: {
        hour: { $hour: { date: '$paidAt', timezone: '+05:30' } },
        grandTotal: 1,
      },
    },
    {
      $group: {
        _id: '$hour',
        revenue: { $sum: '$grandTotal' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Pre-fill all 24 hours to ensure continuous chart flow
  const hoursMap = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    label: `${i.toString().padStart(2, '0')}:00`,
    revenue: 0,
    orders: 0,
  }));

  hourlyStats.forEach(stat => {
    if (stat._id !== null && stat._id >= 0 && stat._id < 24) {
      hoursMap[stat._id].revenue = parseFloat(stat.revenue.toFixed(2));
      hoursMap[stat._id].orders = stat.orders;
    }
  });

  res.json(hoursMap);
});

// @desc    Get Raw Orders for Client-Side Dynamic Pivot
// @route   GET /api/reports/raw-orders
const getRawOrders = asyncHandler(async (req, res) => {
  const { query } = getFilterQuery(req);

  const orders = await Order.find(query)
    .select('billNumber subtotal discountAmount cgst sgst grandTotal orderType source paymentMode paidAt createdAt table createdBy')
    .populate('table', 'number name')
    .populate('createdBy', 'name')
    .sort({ paidAt: 1 });

  const formattedOrders = orders.map(o => ({
    id: o._id,
    billNumber: o.billNumber || 'N/A',
    subtotal: o.subtotal,
    discountAmount: o.discountAmount,
    cgst: o.cgst,
    sgst: o.sgst,
    grandTotal: o.grandTotal,
    orderType: o.orderType,
    source: o.source,
    paymentMode: o.paymentMode,
    paidAt: o.paidAt,
    dateString: o.paidAt ? new Date(o.paidAt).toLocaleDateString('en-IN') : 'N/A',
    table: o.table ? `Table ${o.table.number}` : 'Takeaway/Online',
    cashier: o.createdBy ? o.createdBy.name : 'System',
  }));

  res.json(formattedOrders);
});

module.exports = {
  getSalesSummary,
  getItemPerformance,
  getPaymentPerformance,
  getSourcePerformance,
  getTablePerformance,
  getHourlyPerformance,
  getRawOrders,
};

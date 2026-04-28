const asyncHandler = require('express-async-handler');
const Table = require('../models/Table');

// @desc  Get all tables
// @route GET /api/tables
const getTables = asyncHandler(async (req, res) => {
  const tables = await Table.find().sort({ number: 1 }).populate('currentOrder', 'status grandTotal');
  res.json(tables);
});

// @desc  Create table
// @route POST /api/tables
const createTable = asyncHandler(async (req, res) => {
  const { number, name, capacity, section } = req.body;
  const exists = await Table.findOne({ number });
  if (exists) { res.status(400); throw new Error('Table number already exists'); }
  const table = await Table.create({ number, name, capacity, section });
  res.status(201).json(table);
});

// @desc  Update table
// @route PUT /api/tables/:id
const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!table) { res.status(404); throw new Error('Table not found'); }
  res.json(table);
});

// @desc  Delete table
// @route DELETE /api/tables/:id
const deleteTable = asyncHandler(async (req, res) => {
  const table = await Table.findById(req.params.id);
  if (!table) { res.status(404); throw new Error('Table not found'); }
  if (table.status !== 'available') { res.status(400); throw new Error('Cannot delete occupied table'); }
  await table.deleteOne();
  res.json({ message: 'Table deleted' });
});

// @desc  Update table status (also emits socket event)
// @route PATCH /api/tables/:id/status
const updateTableStatus = asyncHandler(async (req, res) => {
  const { status, currentOrder } = req.body;
  const table = await Table.findByIdAndUpdate(
    req.params.id,
    { status, currentOrder: currentOrder || null },
    { new: true }
  );
  if (!table) { res.status(404); throw new Error('Table not found'); }

  // Emit socket event
  const io = req.app.get('io');
  if (io) {
    io.emit('table_status_changed', { tableId: table._id, status: table.status, tableNumber: table.number });
  }

  res.json(table);
});

module.exports = { getTables, createTable, updateTable, deleteTable, updateTableStatus };

const asyncHandler = require('express-async-handler');
const Item = require('../models/Item');

// @desc  Get all items (optionally filter by category)
// @route GET /api/items
const getItems = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.available === 'true') filter.isAvailable = true;
  const items = await Item.find(filter).sort({ category: 1, sortOrder: 1, name: 1 });
  res.json(items);
});

// @desc  Get all unique categories
// @route GET /api/items/categories
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Item.distinct('category');
  res.json(categories);
});

// @desc  Create item
// @route POST /api/items
const createItem = asyncHandler(async (req, res) => {
  const item = await Item.create(req.body);
  res.status(201).json(item);
});

// @desc  Update item
// @route PUT /api/items/:id
const updateItem = asyncHandler(async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!item) { res.status(404); throw new Error('Item not found'); }
  res.json(item);
});

// @desc  Toggle item availability
// @route PATCH /api/items/:id/toggle
const toggleItem = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) { res.status(404); throw new Error('Item not found'); }
  item.isAvailable = !item.isAvailable;
  await item.save();
  res.json({ isAvailable: item.isAvailable });
});

// @desc  Delete item
// @route DELETE /api/items/:id
const deleteItem = asyncHandler(async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) { res.status(404); throw new Error('Item not found'); }
  res.json({ message: 'Item deleted' });
});

module.exports = { getItems, getCategories, createItem, updateItem, toggleItem, deleteItem };

const express = require('express');
const router = express.Router();
const { getItems, getCategories, createItem, updateItem, toggleItem, deleteItem } = require('../controllers/itemController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/categories', protect, getCategories);
router.get('/', protect, getItems);
router.post('/', protect, adminOnly, createItem);
router.put('/:id', protect, adminOnly, updateItem);
router.patch('/:id/toggle', protect, adminOnly, toggleItem);
router.delete('/:id', protect, adminOnly, deleteItem);

module.exports = router;

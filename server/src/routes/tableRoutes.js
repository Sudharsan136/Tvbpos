const express = require('express');
const router = express.Router();
const { getTables, createTable, updateTable, deleteTable, updateTableStatus } = require('../controllers/tableController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', protect, getTables);
router.post('/', protect, adminOnly, createTable);
router.put('/:id', protect, adminOnly, updateTable);
router.delete('/:id', protect, adminOnly, deleteTable);
router.patch('/:id/status', protect, updateTableStatus);

module.exports = router;

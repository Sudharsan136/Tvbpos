const express = require('express');
const router = express.Router();
const { getDashboard, getActiveKots } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.get('/', protect, adminOnly, getDashboard);
router.get('/kots', protect, getActiveKots);

module.exports = router;

const express = require('express');
const router = express.Router();
const { login, logout, getMe, getUsers, createUser, toggleUser } = require('../controllers/authController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');

router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/users', protect, adminOnly, getUsers);
router.post('/users', protect, adminOnly, createUser);
router.patch('/users/:id/toggle', protect, adminOnly, toggleUser);

module.exports = router;

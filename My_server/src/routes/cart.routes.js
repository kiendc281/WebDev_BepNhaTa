const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const { authenticateToken } = require('../middleware/auth');

// Public routes - no authentication needed
// None for cart since cart operations require authentication

// Protected routes - authentication required
router.get('/', authenticateToken, cartController.getUserCart);
router.post('/', authenticateToken, cartController.updateUserCart);
router.delete('/', authenticateToken, cartController.clearUserCart);

module.exports = router; 
const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');

// Cart Management Routes
router.get('/carts', cartController.getAllCarts);
router.get('/carts/:id', cartController.getCartById);
router.get('/carts/account/:accountId', cartController.getCartByAccountId);
router.post('/carts', cartController.createCart);
router.put('/carts/:id', cartController.updateCart);
router.post('/carts/:id/add', cartController.addToCart);
router.post('/carts/:id/remove', cartController.removeFromCart);
router.delete('/carts/:id', cartController.deleteCart);

module.exports = router; 
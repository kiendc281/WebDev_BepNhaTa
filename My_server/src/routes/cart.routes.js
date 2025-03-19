const express = require('express');
const cartController = require('../controllers/cart.controller');
const router = express.Router();

// Lấy tất cả giỏ hàng - Admin route
router.get('/cart/all', cartController.getAllCarts);

// Lấy giỏ hàng theo ID
router.get('/cart/:id', cartController.getCartById);

// Lấy giỏ hàng theo accountId
router.get('/cart/account/:accountId', cartController.getCartByAccountId);

// Lấy giỏ hàng người dùng
<<<<<<< HEAD
router.get('/cart/user', cartController.getUserCart);
=======
router.get('/cart/user/cart', cartController.getUserCart);
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5

// Cập nhật giỏ hàng
router.post('/cart/update', cartController.updateUserCart);

// Xóa giỏ hàng
router.delete('/cart/clear', cartController.clearUserCart);

// Thêm sản phẩm vào giỏ hàng
router.post('/cart/add-item', cartController.addToCart);

// Xóa sản phẩm khỏi giỏ hàng
router.post('/cart/remove-item', cartController.removeFromCart);

module.exports = router; 
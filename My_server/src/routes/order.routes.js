const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Lấy tất cả đơn hàng
router.get('/all-orders', orderController.getAllOrders);

// Lấy tất cả đơn hàng của một người dùng
router.get('/orders/account/:accountId', orderController.getOrdersByUser);

// Lấy thông tin một đơn hàng
router.get('/orders/:id', orderController.getOrderById);

// Tạo đơn hàng mới (chung cho cả khách và người dùng đã đăng nhập)
router.post('/orders', orderController.createOrder);

// Tạo đơn hàng cho khách vãng lai (để tương thích với API trước đây)
router.post('/guest-orders', orderController.createGuestOrder);

// Cập nhật trạng thái đơn hàng
router.put('/orders/:id/status', orderController.updateOrderStatus);

// Hủy đơn hàng
router.put('/orders/:id/cancel', orderController.cancelOrder);

module.exports = router; 
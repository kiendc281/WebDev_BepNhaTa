const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Lấy tất cả đơn hàng
router.get('/all-orders', orderController.getAllOrders);

// Lấy tất cả đơn hàng của một người dùng
router.get('/orders/account/:accountId', orderController.getOrdersByUser);

// Lấy thông tin một đơn hàng
router.get('/orders/:id', orderController.getOrderById);

// Tạo đơn hàng mới
router.post('/orders', orderController.createOrder);

// Cập nhật trạng thái đơn hàng
router.put('/orders/:id/status', orderController.updateOrderStatus);

// Hủy đơn hàng
router.put('/orders/:id/cancel', orderController.cancelOrder);

module.exports = router; 
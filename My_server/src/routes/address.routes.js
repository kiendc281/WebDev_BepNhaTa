const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');

// Lấy tất cả địa chỉ (không phân biệt accountId)
router.get('/all-addresses', addressController.getAllAddresses);

// Lấy tất cả địa chỉ của một người dùng
router.get('/addresses/account/:accountId', addressController.getAddressesByUser);

// Lấy địa chỉ theo ID
router.get('/addresses/:id', addressController.getAddressById);

// Thêm địa chỉ mới
router.post('/addresses', addressController.createAddress);

// Cập nhật địa chỉ
router.put('/addresses/:id', addressController.updateAddress);

// Xóa địa chỉ
router.delete('/addresses/:id', addressController.deleteAddress);

// Đặt địa chỉ mặc định
router.put('/addresses/:id/default', addressController.setDefaultAddress);

module.exports = router; 
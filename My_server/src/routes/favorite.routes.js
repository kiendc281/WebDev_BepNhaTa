const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');

// Lấy danh sách yêu thích
router.get('/favorites', favoriteController.getFavorites);

// Kiểm tra đã yêu thích chưa
router.get('/favorites/check', favoriteController.checkFavorite);

// Thêm vào yêu thích
router.post('/favorites', favoriteController.addToFavorites);

// Xóa khỏi yêu thích
router.delete('/favorites', favoriteController.removeFromFavorites);

// API mới: Lấy danh sách yêu thích với chi tiết đầy đủ theo loại
router.get('/favorites/details/:type', favoriteController.getFavoritesWithDetails);

// Thêm/bỏ sản phẩm yêu thích
router.post('/favorites/toggle', favoriteController.toggleFavorite);

module.exports = router; 
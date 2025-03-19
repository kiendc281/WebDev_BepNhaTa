const express = require('express');
const router = express.Router();
const IngredientController = require('../controllers/ingredientController');

// Lấy tất cả ingredients và tìm kiếm
router.get('/ingredients', IngredientController.getAllIngredients);

// Lấy ingredient theo ID
router.get('/ingredients/:id', IngredientController.getIngredientById);

// Tạo ingredient mới
router.post('/ingredients', IngredientController.createIngredient);

// Cập nhật ingredient
router.patch('/ingredients/:id', IngredientController.updateIngredient);

// Cập nhật số lượng ingredient
router.patch('/ingredients/:id/quantity', IngredientController.updateQuantity);

// Xóa ingredient
router.delete('/ingredients/:id', IngredientController.deleteIngredient);

// Cập nhật số lượng nguyên liệu sau khi đặt hàng
router.post('/ingredients/update-inventory', IngredientController.updateInventoryAfterOrder);

module.exports = router; 
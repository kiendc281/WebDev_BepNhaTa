const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');

const menuController = new MenuController(); // Tạo instance của controller

// Các routes cho menu
router.get('/menus', menuController.getAllMenus);
router.get('/menus/:id', menuController.getMenuById);
router.post('/menus', menuController.createMenu);
router.patch('/menus/:id', menuController.updateMenu);
router.delete('/menus/:id', menuController.deleteMenu);

// Routes cho việc quản lý ingredients trong menu
router.post('/menus/:menuId/ingredients', menuController.addIngredientToMenu);
router.delete('/menus/:menuId/ingredients/:ingredientId', menuController.removeIngredientFromMenu);

module.exports = router;
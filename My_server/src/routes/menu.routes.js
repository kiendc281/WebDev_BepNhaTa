const express = require('express');
const router = express.Router();
const MenuController = require('../controllers/menuController');

router.get('/menus', MenuController.getAllMenus);
router.get('/menus/:id', MenuController.getMenuById);
router.post('/menus', MenuController.createMenu);
router.patch('/menus/:id', MenuController.updateMenu);
router.delete('/menus/:id', MenuController.deleteMenu);

module.exports = router;
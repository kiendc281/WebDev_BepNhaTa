const menuService = require('../services/menuServices');

class MenuController {
    // Lấy tất cả menus
    async getAllMenus(req, res) {
        try {
            const menus = await menuService.getAllMenus();
            res.status(200).json({
                status: 'success',
                data: menus
            });
        } catch (error) {
            res.status(500).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Lấy menu theo ID
    async getMenuById(req, res) {
        try {
            const menu = await menuService.getMenuById(req.params.id);
            res.status(200).json({
                status: 'success',
                data: menu
            });
        } catch (error) {
            res.status(404).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Tạo menu mới
    async createMenu(req, res) {
        try {
            const newMenu = await menuService.createMenu(req.body);
            res.status(201).json({
                status: 'success',
                data: newMenu
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Cập nhật menu
    async updateMenu(req, res) {
        try {
            const menu = await menuService.updateMenu(req.params.id, req.body);
            res.status(200).json({
                status: 'success',
                data: menu
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }

    // Xóa menu
    async deleteMenu(req, res) {
        try {
            await menuService.deleteMenu(req.params.id);
            res.status(200).json({
                status: 'success',
                message: 'Menu deleted successfully'
            });
        } catch (error) {
            res.status(400).json({
                status: 'error',
                message: error.message
            });
        }
    }
}

module.exports = new MenuController();
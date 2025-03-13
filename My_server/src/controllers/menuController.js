const menuService = require('../services/menuServices');

class MenuController {
    constructor() {
        // Bind các methods với instance
        this.getAllMenus = this.getAllMenus.bind(this);
        this.getMenuById = this.getMenuById.bind(this);
        this.createMenu = this.createMenu.bind(this);
        this.updateMenu = this.updateMenu.bind(this);
        this.deleteMenu = this.deleteMenu.bind(this);
        this.addIngredientToMenu = this.addIngredientToMenu.bind(this);
        this.removeIngredientFromMenu = this.removeIngredientFromMenu.bind(this);
    }

    // Lấy tất cả menus
    async getAllMenus(req, res) {
        try {
            const menus = await menuService.getAllMenus();
            res.status(200).json({
                status: "success",
                data: menus
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Lấy menu theo ID
    async getMenuById(req, res) {
        try {
            const menu = await menuService.getMenuById(req.params.id);
            res.status(200).json({
                status: "success",
                data: menu
            });
        } catch (error) {
            res.status(404).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Tạo menu mới
    async createMenu(req, res) {
        try {
            const menu = await menuService.createMenu(req.body);
            res.status(201).json({
                status: "success",
                data: menu
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Cập nhật menu
    async updateMenu(req, res) {
        try {
            const menu = await menuService.updateMenu(req.params.id, req.body);
            res.status(200).json({
                status: "success",
                data: menu
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Xóa menu
    async deleteMenu(req, res) {
        try {
            await menuService.deleteMenu(req.params.id);
            res.status(200).json({
                status: "success",
                message: "Xóa menu thành công"
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Thêm ingredient vào menu
    async addIngredientToMenu(req, res) {
        try {
            const menu = await menuService.addIngredientToMenu(
                req.params.menuId,
                req.body.ingredientId
            );
            res.status(200).json({
                status: "success",
                data: menu
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Xóa ingredient khỏi menu
    async removeIngredientFromMenu(req, res) {
        try {
            const menu = await menuService.removeIngredientFromMenu(
                req.params.menuId,
                req.params.ingredientId
            );
            res.status(200).json({
                status: "success",
                data: menu
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }
}

module.exports = MenuController;
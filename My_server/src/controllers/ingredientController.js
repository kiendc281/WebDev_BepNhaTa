const ingredientService = require('../services/ingredientServices');

class IngredientController {
    // Lấy tất cả ingredients
    async getAllIngredients(req, res) {
        try {
            const ingredients = await ingredientService.getAllIngredients(req.query);
            res.status(200).json(ingredients);
        } catch (error) {
            res.status(500).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Lấy ingredient theo ID
    async getIngredientById(req, res) {
        try {
            const ingredient = await ingredientService.getIngredientById(req.params.id);
            res.status(200).json({
                status: "success",
                data: ingredient
            });
        } catch (error) {
            res.status(404).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Tạo ingredient mới
    async createIngredient(req, res) {
        try {
            const ingredient = await ingredientService.createIngredient(req.body);
            res.status(201).json({
                status: "success",
                data: ingredient
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Cập nhật ingredient
    async updateIngredient(req, res) {
        try {
            const ingredient = await ingredientService.updateIngredient(req.params.id, req.body);
            res.status(200).json({
                status: "success",
                data: ingredient
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Cập nhật số lượng
    async updateQuantity(req, res) {
        try {
            const ingredient = await ingredientService.updateQuantity(req.params.id, req.body.quantity);
            res.status(200).json({
                status: "success",
                data: ingredient
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }

    // Xóa ingredient
    async deleteIngredient(req, res) {
        try {
            await ingredientService.deleteIngredient(req.params.id);
            res.status(200).json({
                status: "success",
                message: "Xóa nguyên liệu thành công"
            });
        } catch (error) {
            res.status(400).json({
                status: "error",
                message: error.message
            });
        }
    }
}

module.exports = new IngredientController(); 
const Menu = require('../models/menu');

class MenuService {
    // Lấy tất cả menus
    async getAllMenus() {
        try {
            const menus = await Menu.find()
                .populate('ingredients', 'ingredientName mainImage price');
            return menus;
        } catch (error) {
            throw new Error('Không thể lấy danh sách menu: ' + error.message);
        }
    }

    // Lấy menu theo ID
    async getMenuById(id) {
        try {
            const menu = await Menu.findById(id)
                .populate('ingredients', 'ingredientName mainImage price description');
            if (!menu) {
                throw new Error('Không tìm thấy menu');
            }
            return menu;
        } catch (error) {
            throw new Error('Không tìm thấy menu: ' + error.message);
        }
    }

    // Tạo menu mới
    async createMenu(menuData) {
        try {
            const menu = new Menu(menuData);
            return await menu.save();
        } catch (error) {
            throw new Error('Tạo menu thất bại: ' + error.message);
        }
    }

    // Cập nhật menu
    async updateMenu(id, updateData) {
        try {
            const menu = await Menu.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).populate('ingredients', 'ingredientName mainImage price');

            if (!menu) {
                throw new Error('Không tìm thấy menu');
            }

            return menu;
        } catch (error) {
            throw new Error('Cập nhật menu thất bại: ' + error.message);
        }
    }

    // Xóa menu
    async deleteMenu(id) {
        try {
            const menu = await Menu.findByIdAndDelete(id);
            if (!menu) {
                throw new Error('Không tìm thấy menu');
            }
            return menu;
        } catch (error) {
            throw new Error('Xóa menu thất bại: ' + error.message);
        }
    }

    // Thêm ingredient vào menu
    async addIngredientToMenu(menuId, ingredientId) {
        try {
            const menu = await Menu.findById(menuId);
            if (!menu) {
                throw new Error('Không tìm thấy menu');
            }

            if (!menu.ingredients.includes(ingredientId)) {
                menu.ingredients.push(ingredientId);
                await menu.save();
            }

            return await menu.populate('ingredients', 'ingredientName mainImage price');
        } catch (error) {
            throw new Error('Thêm ingredient thất bại: ' + error.message);
        }
    }

    // Xóa ingredient khỏi menu
    async removeIngredientFromMenu(menuId, ingredientId) {
        try {
            const menu = await Menu.findById(menuId);
            if (!menu) {
                throw new Error('Không tìm thấy menu');
            }

            menu.ingredients = menu.ingredients.filter(id => id !== ingredientId);
            await menu.save();

            return await menu.populate('ingredients', 'ingredientName mainImage price');
        } catch (error) {
            throw new Error('Xóa ingredient thất bại: ' + error.message);
        }
    }
}

module.exports = new MenuService();
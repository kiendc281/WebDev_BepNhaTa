const Menu = require('../models/menu');
const mongoose = require('mongoose');

class MenuService {
    // Lấy tất cả menus
    async getAllMenus() {
        try {
            return await Menu.find().populate('ingredientId');
        } catch (error) {
            throw new Error('Không thể lấy danh sách menu');
        }
    }

    // Lấy menu theo ID
    async getMenuById(id) {
        try {
            const menu = await Menu.findById(id).populate('ingredientId');
            if (!menu) {
                throw new Error('Không tìm thấy menu');
            }
            return menu;
        } catch (error) {
            throw new Error('Không tìm thấy menu');
        }
    }

    // Tạo menu mới
    async createMenu(menuData) {
        try {
            // Kiểm tra menuId đã tồn tại chưa
            const existingMenu = await Menu.findOne({ menuId: menuData.menuId });
            if (existingMenu) {
                throw new Error('MenuId đã tồn tại');
            }

            const menu = new Menu({
                _id: new mongoose.Types.ObjectId(),
                ...menuData
            });

            const savedMenu = await menu.save();
            return savedMenu;
        } catch (error) {
            throw new Error('Tạo menu thất bại: ' + error.message);
        }
    }

    // Cập nhật menu
    async updateMenu(id, updateData) {
        try {
            // Nếu có menuId trong dữ liệu cập nhật, kiểm tra trùng lặp
            if (updateData.menuId) {
                const existingMenu = await Menu.findOne({ 
                    menuId: updateData.menuId,
                    _id: { $ne: id } // Không tính menu hiện tại
                });
                if (existingMenu) {
                    throw new Error('MenuId đã tồn tại');
                }
            }

            const menu = await Menu.findByIdAndUpdate(
                id,
                updateData,
                { new: true }
            ).populate('ingredientId');

            if (!menu) {
                throw new Error('Không tìm thấy menu');
            }

            return menu;
        } catch (error) {
            throw new Error('Cập nhật thất bại: ' + error.message);
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
            throw new Error('Xóa thất bại: ' + error.message);
        }
    }

    // Tìm menu theo menuId
    async getMenuByMenuId(menuId) {
        try {
            const menu = await Menu.findOne({ menuId }).populate('ingredientId');
            if (!menu) {
                throw new Error('Không tìm thấy menu');
            }
            return menu;
        } catch (error) {
            throw new Error('Không tìm thấy menu');
        }
    }
}

module.exports = new MenuService();
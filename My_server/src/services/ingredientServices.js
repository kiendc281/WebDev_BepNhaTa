const Ingredient = require('../models/ingredient');
const mongoose = require('mongoose');

class IngredientService {
    // Lấy tất cả ingredients với các tùy chọn lọc
    async getAllIngredients(query = {}) {
        try {
            let filter = {};
            
            // Lọc theo category
            if (query.category) {
                filter.category = query.category;
            }
            
            // Lọc theo region
            if (query.region) {
                filter.region = query.region;
            }
            
            // Lọc theo status
            if (query.status) {
                filter.status = query.status;
            }

            // Tìm kiếm theo tên
            if (query.search) {
                filter.ingredientName = { $regex: query.search, $options: 'i' };
            }

            let ingredients = await Ingredient.find(filter)
                .populate('relatedProductIds', 'ingredientName mainImage')
                .populate('suggestedRecipeIds', 'recipeName recipeImage');

            // Chuyển đổi components thành chuỗi
            ingredients = ingredients.map(ingredient => {
                const doc = ingredient.toObject();
                if (doc.components) {
                    doc.components = doc.components.map(comp => 
                        this.convertComponentToString(comp)
                    );
                }
                return doc;
            });

            return ingredients;
        } catch (error) {
            throw new Error('Không thể lấy danh sách nguyên liệu: ' + error.message);
        }
    }

    // Lấy ingredient theo ID
    async getIngredientById(id) {
        try {
            let ingredient = await Ingredient.findById(id)
                .populate('relatedProductIds', 'ingredientName mainImage')
                .populate('suggestedRecipeIds', 'recipeName recipeImage');
                
            if (!ingredient) {
                throw new Error('Không tìm thấy nguyên liệu');
            }

            // Chuyển đổi components thành chuỗi
            const doc = ingredient.toObject();
            if (doc.components) {
                doc.components = doc.components.map(comp => 
                    this.convertComponentToString(comp)
                );
            }

            return doc;
        } catch (error) {
            throw new Error('Không tìm thấy nguyên liệu');
        }
    }

    // Tạo ingredient mới
    async createIngredient(ingredientData) {
        try {
            // Kiểm tra tên nguyên liệu đã tồn tại
            const existingIngredient = await Ingredient.findOne({ 
                ingredientName: ingredientData.ingredientName 
            });
            
            if (existingIngredient) {
                throw new Error('Tên nguyên liệu đã tồn tại');
            }

            // Nếu components là mảng chuỗi, giữ nguyên
            // Nếu là mảng object ký tự, chuyển đổi thành chuỗi
            if (ingredientData.components) {
                ingredientData.components = ingredientData.components.map(comp => 
                    this.convertComponentToString(comp)
                );
            }

            const ingredient = new Ingredient(ingredientData);
            return await ingredient.save();
        } catch (error) {
            throw new Error('Tạo nguyên liệu thất bại: ' + error.message);
        }
    }

    // Cập nhật ingredient
    async updateIngredient(id, updateData) {
        try {
            // Kiểm tra tên nguyên liệu đã tồn tại (nếu cập nhật tên)
            if (updateData.ingredientName) {
                const existingIngredient = await Ingredient.findOne({
                    ingredientName: updateData.ingredientName,
                    _id: { $ne: id }
                });
                
                if (existingIngredient) {
                    throw new Error('Tên nguyên liệu đã tồn tại');
                }
            }

            const ingredient = await Ingredient.findByIdAndUpdate(
                id,
                {
                    ...updateData,
                    updatedAt: Date.now()
                },
                { new: true }
            ).populate('relatedProductIds', 'ingredientName mainImage')
             .populate('suggestedRecipeIds', 'recipeName recipeImage');

            if (!ingredient) {
                throw new Error('Không tìm thấy nguyên liệu');
            }

            return ingredient;
        } catch (error) {
            throw new Error('Cập nhật thất bại: ' + error.message);
        }
    }

    // Cập nhật số lượng
    async updateQuantity(id, quantity) {
        try {
            const ingredient = await Ingredient.findById(id);
            
            if (!ingredient) {
                throw new Error('Không tìm thấy nguyên liệu');
            }

            ingredient.quantity = quantity;
            ingredient.status = quantity > 0 ? 'Còn hàng' : 'Hết hàng';
            ingredient.updatedAt = Date.now();

            return await ingredient.save();
        } catch (error) {
            throw new Error('Cập nhật số lượng thất bại: ' + error.message);
        }
    }

    // Xóa ingredient
    async deleteIngredient(id) {
        try {
            const ingredient = await Ingredient.findByIdAndDelete(id);
            if (!ingredient) {
                throw new Error('Không tìm thấy nguyên liệu');
            }
            return ingredient;
        } catch (error) {
            throw new Error('Xóa thất bại: ' + error.message);
        }
    }

    // Hàm chuyển đổi component từ object ký tự thành chuỗi
    convertComponentToString(component) {
        if (typeof component === 'string') return component;
        
        // Đếm số lượng ký tự (bỏ qua _id)
        const charCount = Object.keys(component)
            .filter(key => !isNaN(key))
            .length;
        
        // Ghép các ký tự lại thành chuỗi
        let result = '';
        for (let i = 0; i < charCount; i++) {
            result += component[i.toString()];
        }
        return result;
    }
}

module.exports = new IngredientService(); 
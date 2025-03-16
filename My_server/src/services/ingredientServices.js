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

            // Chuyển đổi ingredients để phù hợp với client
            ingredients = ingredients.map(ingredient => {
                const doc = ingredient.toObject();
                
                // Chuyển đổi pricePerPortion từ mảng sang object
                if (doc.pricePerPortion && Array.isArray(doc.pricePerPortion)) {
                    const pricePerPortionObj = {};
                    doc.pricePerPortion.forEach(item => {
                        if (item.portion && item.price !== undefined) {
                            pricePerPortionObj[item.portion] = item.price;
                        }
                    });
                    doc.pricePerPortion = pricePerPortionObj;
                }
                
                // Chuyển đổi components thành chuỗi
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

            // Chuyển đổi dữ liệu để phù hợp với client
            const doc = ingredient.toObject();
            
            // Chuyển đổi pricePerPortion từ mảng sang object
            if (doc.pricePerPortion && Array.isArray(doc.pricePerPortion)) {
                const pricePerPortionObj = {};
                doc.pricePerPortion.forEach(item => {
                    if (item.portion && item.price !== undefined) {
                        pricePerPortionObj[item.portion] = item.price;
                    }
                });
                doc.pricePerPortion = pricePerPortionObj;
            }
            
            // Chuyển đổi components thành chuỗi
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

            // Nếu pricePerPortion là object, chuyển đổi sang mảng để lưu trong MongoDB
            if (ingredientData.pricePerPortion && typeof ingredientData.pricePerPortion === 'object' && !Array.isArray(ingredientData.pricePerPortion)) {
                const pricePerPortionArray = [];
                Object.keys(ingredientData.pricePerPortion).forEach(portion => {
                    pricePerPortionArray.push({
                        portion: portion,
                        price: ingredientData.pricePerPortion[portion]
                    });
                });
                ingredientData.pricePerPortion = pricePerPortionArray;
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

    // Chuyển đổi component sang dạng chuỗi nếu nó là object
    convertComponentToString(component) {
        if (typeof component === 'string') {
            return component;
        }
        
        if (typeof component === 'object' && component !== null) {
            let result = component.name || '';
            if (component.quantity) {
                result += ` - ${component.quantity}`;
                if (component.unit) {
                    result += ` ${component.unit}`;
                }
            }
            if (component.notes) {
                result += ` (${component.notes})`;
            }
            return result;
        }
        
        return 'Unknown component';
    }

    // Cập nhật ingredient
    async updateIngredient(id, ingredientData) {
        try {
            // Kiểm tra tên nguyên liệu đã tồn tại
            if (ingredientData.ingredientName) {
                const existingIngredient = await Ingredient.findOne({
                    ingredientName: ingredientData.ingredientName,
                    _id: { $ne: id }
                });
                
                if (existingIngredient) {
                    throw new Error('Tên nguyên liệu đã tồn tại');
                }
            }

            // Nếu pricePerPortion là object, chuyển đổi sang mảng để lưu trong MongoDB
            if (ingredientData.pricePerPortion && typeof ingredientData.pricePerPortion === 'object' && !Array.isArray(ingredientData.pricePerPortion)) {
                const pricePerPortionArray = [];
                Object.keys(ingredientData.pricePerPortion).forEach(portion => {
                    pricePerPortionArray.push({
                        portion: portion,
                        price: ingredientData.pricePerPortion[portion]
                    });
                });
                ingredientData.pricePerPortion = pricePerPortionArray;
            }

            // Nếu components được gửi lên, chuyển đổi thành chuỗi nếu cần
            if (ingredientData.components) {
                ingredientData.components = ingredientData.components.map(comp =>
                    this.convertComponentToString(comp)
                );
            }

            // Tìm và cập nhật nguyên liệu
            const ingredient = await Ingredient.findByIdAndUpdate(
                id,
                ingredientData,
                { new: true, runValidators: true }
            );

            if (!ingredient) {
                throw new Error('Không tìm thấy nguyên liệu');
            }

            return ingredient;
        } catch (error) {
            throw new Error('Cập nhật nguyên liệu thất bại: ' + error.message);
        }
    }

    // Cập nhật số lượng
    async updateQuantity(id, quantity) {
        try {
            const ingredient = await Ingredient.findByIdAndUpdate(
                id,
                { quantity: quantity },
                { new: true, runValidators: true }
            );

            if (!ingredient) {
                throw new Error('Không tìm thấy nguyên liệu');
            }

            return ingredient;
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
            throw new Error('Xóa nguyên liệu thất bại: ' + error.message);
        }
    }
}

module.exports = new IngredientService();
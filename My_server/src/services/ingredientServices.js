const Ingredient = require('../models/ingredient');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Attempt to load Ingredients.json as a fallback data source
let ingredientsJsonData = [];
try {
    const ingredientsJsonPath = path.join(__dirname, '../../../data/Ingredients.json');
    if (fs.existsSync(ingredientsJsonPath)) {
        const jsonData = fs.readFileSync(ingredientsJsonPath, 'utf8');
        ingredientsJsonData = JSON.parse(jsonData);
        console.log('Successfully loaded Ingredients.json as fallback data source');
    }
} catch (error) {
    console.error('Error loading Ingredients.json fallback data:', error.message);
}

// Helper function to get components for a specific ingredient by name
function getComponentsFromJson(ingredientName) {
    if (ingredientsJsonData && ingredientsJsonData.length > 0) {
        const ingredient = ingredientsJsonData.find(
            item => item.ingredientName === ingredientName || 
                   item.title === ingredientName
        );
        
        if (ingredient && ingredient.components && ingredient.components.length > 0) {
            console.log(`Found components in JSON for ${ingredientName}:`, ingredient.components);
            return ingredient.components;
        }
    }
    return null;
}

// Helper function to get price per portion from JSON
function getPricePerPortionFromJson(ingredientName) {
    if (ingredientsJsonData && ingredientsJsonData.length > 0) {
        const ingredient = ingredientsJsonData.find(
            item => item.ingredientName === ingredientName || 
                   item.title === ingredientName
        );
        
        if (ingredient && ingredient.pricePerPortion) {
            console.log(`Found pricePerPortion in JSON for ${ingredientName}:`, ingredient.pricePerPortion);
            return ingredient.pricePerPortion;
        }
    }
    return null;
}

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

            console.log("Raw ingredients data from database:", JSON.stringify(ingredients[0], null, 2));

            // Chuyển đổi ingredients để phù hợp với client
            ingredients = ingredients.map(ingredient => {
                const doc = ingredient.toObject();
                
                // Chuyển đổi pricePerPortion từ mảng sang object và trích xuất thông tin về số lượng
                if (doc.pricePerPortion && Array.isArray(doc.pricePerPortion)) {
                    const pricePerPortionObj = {};
                    const portionQuantitiesObj = {};
                    
                    // Lưu lại mảng pricePerPortion gốc để client có thể truy cập
                    doc.pricePerPortionArray = JSON.parse(JSON.stringify(doc.pricePerPortion));
                    
                    // Trích xuất giá và số lượng cho từng khẩu phần
                    doc.pricePerPortion.forEach(item => {
                        if (item.portion && item.price !== undefined) {
                            pricePerPortionObj[item.portion] = item.price;
                            
                            // Lưu số lượng nếu có
                            if (item.quantity !== undefined) {
                                portionQuantitiesObj[item.portion] = item.quantity;
                            }
                        }
                    });
                    
                    // Gán lại các giá trị đã trích xuất
                    doc.pricePerPortion = pricePerPortionObj;
                    doc.portionQuantities = portionQuantitiesObj;
                    
                    // Log để debug
                    console.log(`Extracted prices for ${doc.ingredientName}:`, pricePerPortionObj);
                    console.log(`Extracted quantities for ${doc.ingredientName}:`, portionQuantitiesObj);
                    
                    // Nếu pricePerPortion rỗng, tìm trong JSON
                    if (Object.keys(pricePerPortionObj).length === 0) {
                        const jsonPrices = getPricePerPortionFromJson(doc.ingredientName);
                        if (jsonPrices) {
                            console.log("Using pricePerPortion from JSON file for:", doc.ingredientName);
                            doc.pricePerPortion = jsonPrices;
                        } else {
                            // Thiết lập giá mặc định nếu không tìm thấy trong JSON
                            console.log("Using default prices for:", doc.ingredientName);
                            doc.pricePerPortion = {
                                "2": 180000,
                                "4": 320000
                            };
                        }
                    }
                } else if (!doc.pricePerPortion || Object.keys(doc.pricePerPortion).length === 0) {
                    // Tìm pricePerPortion trong JSON
                    const jsonPrices = getPricePerPortionFromJson(doc.ingredientName);
                    if (jsonPrices) {
                        console.log("Using pricePerPortion from JSON file for missing prices:", doc.ingredientName);
                        doc.pricePerPortion = jsonPrices;
                    } else {
                        // Thiết lập giá mặc định nếu không tìm thấy trong JSON
                        console.log("Using default prices for missing pricePerPortion:", doc.ingredientName);
                        doc.pricePerPortion = {
                            "2": 180000,
                            "4": 320000
                        };
                    }
                }
                
                // Xử lý components
                if (doc.components) {
                    // Debug log
                    console.log("Original components:", JSON.stringify(doc.components, null, 2));
                    
                    if (doc.components.length === 0 || (doc.components.length > 0 && doc.components.every(comp => comp === 'Unknown component' || (typeof comp === 'object' && comp.name === 'Unknown component')))) {
                        // Thử tìm components từ file JSON
                        const jsonComponents = getComponentsFromJson(doc.ingredientName);
                        if (jsonComponents) {
                            console.log("Using components from JSON file for:", doc.ingredientName);
                            doc.components = jsonComponents;
                        } else {
                            // Fallback to default list if not found in JSON
                            console.log("Using default components list for:", doc.ingredientName);
                            doc.components = [
                                "Thịt bò",
                                "Xương bò",
                                "Bánh phở",
                                "Hành tây",
                                "Hành lá",
                                "Rau mùi",
                                "Gia vị đặc trưng"
                            ];
                        }
                    } else {
                        // Chuyển đổi components thành chuỗi
                        doc.components = doc.components.map(comp => {
                            if (typeof comp === 'string') {
                                return comp;
                            } else if (typeof comp === 'object' && comp !== null) {
                                return comp.name || 'Unknown component';
                            }
                            return 'Unknown component';
                        });
                        
                        // Nếu vẫn là Unknown component, thử dùng JSON
                        if (doc.components.every(comp => comp === 'Unknown component')) {
                            const jsonComponents = getComponentsFromJson(doc.ingredientName);
                            if (jsonComponents) {
                                console.log("Falling back to JSON components for:", doc.ingredientName);
                                doc.components = jsonComponents;
                            }
                        }
                    }
                    
                    // Debug log
                    console.log("Processed components:", doc.components);
                } else {
                    // Thử tìm components từ file JSON
                    const jsonComponents = getComponentsFromJson(doc.ingredientName);
                    if (jsonComponents) {
                        console.log("Using components from JSON file for missing components:", doc.ingredientName);
                        doc.components = jsonComponents;
                    } else {
                        // Fallback to default list if not found in JSON
                        doc.components = [
                            "Thịt bò",
                            "Xương bò",
                            "Bánh phở",
                            "Hành tây",
                            "Hành lá",
                            "Rau mùi", 
                            "Gia vị đặc trưng"
                        ];
                    }
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

            console.log("Raw ingredient data by ID:", JSON.stringify(ingredient, null, 2));

            // Chuyển đổi dữ liệu để phù hợp với client
            const doc = ingredient.toObject();
            
            // Chuyển đổi pricePerPortion từ mảng sang object và trích xuất thông tin về số lượng
            if (doc.pricePerPortion && Array.isArray(doc.pricePerPortion)) {
                const pricePerPortionObj = {};
                const portionQuantitiesObj = {};
                
                // Lưu lại mảng pricePerPortion gốc để client có thể truy cập
                doc.pricePerPortionArray = JSON.parse(JSON.stringify(doc.pricePerPortion));
                
                // Log để debug
                console.log("Original pricePerPortion array:", doc.pricePerPortionArray);
                
                // Trích xuất giá và số lượng cho từng khẩu phần
                doc.pricePerPortion.forEach(item => {
                    if (item.portion && item.price !== undefined) {
                        pricePerPortionObj[item.portion] = item.price;
                        
                        // Lưu số lượng nếu có
                        if (item.quantity !== undefined) {
                            portionQuantitiesObj[item.portion] = item.quantity;
                        }
                    }
                });
                
                // Gán lại các giá trị đã trích xuất
                doc.pricePerPortion = pricePerPortionObj;
                doc.portionQuantities = portionQuantitiesObj;
                
                // Log để debug
                console.log("Extracted prices:", pricePerPortionObj);
                console.log("Extracted quantities:", portionQuantitiesObj);
                
                // Nếu pricePerPortion rỗng, tìm trong JSON
                if (Object.keys(pricePerPortionObj).length === 0) {
                    const jsonPrices = getPricePerPortionFromJson(doc.ingredientName);
                    if (jsonPrices) {
                        console.log("Using pricePerPortion from JSON file for:", doc.ingredientName);
                        doc.pricePerPortion = jsonPrices;
                    } else {
                        // Thiết lập giá mặc định nếu không tìm thấy trong JSON
                        console.log("Using default prices for:", doc.ingredientName);
                        doc.pricePerPortion = {
                            "2": 180000,
                            "4": 320000
                        };
                    }
                }
            } else if (!doc.pricePerPortion || Object.keys(doc.pricePerPortion).length === 0) {
                // Tìm pricePerPortion trong JSON
                const jsonPrices = getPricePerPortionFromJson(doc.ingredientName);
                if (jsonPrices) {
                    console.log("Using pricePerPortion from JSON file for missing prices:", doc.ingredientName);
                    doc.pricePerPortion = jsonPrices;
                } else {
                    // Thiết lập giá mặc định nếu không tìm thấy trong JSON
                    console.log("Using default prices for missing pricePerPortion:", doc.ingredientName);
                    doc.pricePerPortion = {
                        "2": 180000,
                        "4": 320000
                    };
                }
            }
            
            // Xử lý components
            if (doc.components) {
                // Debug log
                console.log("Original components by ID:", JSON.stringify(doc.components, null, 2));
                
                if (doc.components.length === 0 || (doc.components.length > 0 && doc.components.every(comp => comp === 'Unknown component' || (typeof comp === 'object' && comp.name === 'Unknown component')))) {
                    // Thử tìm components từ file JSON
                    const jsonComponents = getComponentsFromJson(doc.ingredientName);
                    if (jsonComponents) {
                        console.log("Using components from JSON file for:", doc.ingredientName);
                        doc.components = jsonComponents;
                    } else {
                        // Fallback to default list if not found in JSON
                        console.log("Using default components list for:", doc.ingredientName);
                        doc.components = [
                            "Thịt bò",
                            "Xương bò",
                            "Bánh phở",
                            "Hành tây",
                            "Hành lá",
                            "Rau mùi",
                            "Gia vị đặc trưng"
                        ];
                    }
                } else {
                    // Chuyển đổi components thành chuỗi
                    doc.components = doc.components.map(comp => {
                        if (typeof comp === 'string') {
                            return comp;
                        } else if (typeof comp === 'object' && comp !== null) {
                            return comp.name || 'Unknown component';
                        }
                        return 'Unknown component';
                    });
                    
                    // Nếu vẫn là Unknown component, thử dùng JSON
                    if (doc.components.every(comp => comp === 'Unknown component')) {
                        const jsonComponents = getComponentsFromJson(doc.ingredientName);
                        if (jsonComponents) {
                            console.log("Falling back to JSON components for:", doc.ingredientName);
                            doc.components = jsonComponents;
                        }
                    }
                }
                
                // Debug log
                console.log("Processed components by ID:", doc.components);
            } else {
                // Thử tìm components từ file JSON
                const jsonComponents = getComponentsFromJson(doc.ingredientName);
                if (jsonComponents) {
                    console.log("Using components from JSON file for missing components:", doc.ingredientName);
                    doc.components = jsonComponents;
                } else {
                    // Fallback to default list if not found in JSON
                    doc.components = [
                        "Thịt bò",
                        "Xương bò",
                        "Bánh phở",
                        "Hành tây",
                        "Hành lá",
                        "Rau mùi",
                        "Gia vị đặc trưng"
                    ];
                }
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
            // Nếu là mảng object ký tự, chỉ lấy tên thành phần
            if (ingredientData.components) {
                ingredientData.components = ingredientData.components.map(comp => {
                    if (typeof comp === 'string') {
                        return { name: comp };
                    } else if (typeof comp === 'object' && comp !== null) {
                        return comp;
                    }
                    return { name: 'Unknown component' };
                });
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

            // Nếu components được gửi lên, xử lý đúng định dạng
            if (ingredientData.components) {
                ingredientData.components = ingredientData.components.map(comp => {
                    if (typeof comp === 'string') {
                        return { name: comp };
                    } else if (typeof comp === 'object' && comp !== null) {
                        return comp;
                    }
                    return { name: 'Unknown component' };
                });
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
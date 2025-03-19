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

    /**
     * Cập nhật số lượng nguyên liệu sau khi có đơn hàng
     */
    async updateInventoryAfterOrder(req, res) {
        try {
            const { orderId, items } = req.body;
            
            console.log('==== BẮT ĐẦU CẬP NHẬT KHO ====');
            console.log('Dữ liệu nhận được:', JSON.stringify(req.body));
            
            if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
                console.error('Dữ liệu không hợp lệ:', { orderId, items });
                return res.status(400).json({
                    status: 'error',
                    message: 'Dữ liệu không hợp lệ'
                });
            }

            console.log(`Bắt đầu cập nhật kho cho đơn hàng ${orderId} với ${items.length} sản phẩm`);
            
            // Lưu log cập nhật kho
            const updateLog = {
                orderId,
                timestamp: new Date(),
                updates: []
            };

            // Cập nhật từng sản phẩm
            for (const item of items) {
                const { productId, quantity, servingSize } = item;
                
                console.log(`Xử lý sản phẩm: ID=${productId}, SL=${quantity}, Size=${servingSize}`);
                
                if (!productId || !quantity) {
                    console.warn(`Dữ liệu sản phẩm không đầy đủ: ${JSON.stringify(item)}`);
                    updateLog.updates.push({
                        status: 'error',
                        message: 'Dữ liệu sản phẩm không đầy đủ',
                        item
                    });
                    continue;
                }
                
                // Tìm sản phẩm
                const product = await ingredientService.getIngredientById(productId);
                
                if (!product) {
                    console.warn(`Không tìm thấy sản phẩm ID: ${productId}`);
                    updateLog.updates.push({
                        productId,
                        status: 'error',
                        message: 'Không tìm thấy sản phẩm'
                    });
                    continue;
                }
                
                console.log(`Tìm thấy sản phẩm: ${product.ingredientName}, hiện tại: ${product.quantity}`);
                
                // Xác định số lượng cần trừ dựa vào servingSize
                let deductQuantity = quantity;
                let servingSizeValue = '2'; // Mặc định là 2 người
                
                // Nếu có servingSize
                if (servingSize) {
                    servingSizeValue = servingSize.toString();
                    console.log(`Kích thước phần ăn: ${servingSizeValue}`);
                    
                    // Trích xuất số người từ chuỗi
                    let peopleCount = 2; // Mặc định là 2 người
                    
                    if (servingSizeValue.includes('2')) {
                        peopleCount = 2;
                    } else if (servingSizeValue.includes('4')) {
                        peopleCount = 4;
                    } else if (servingSizeValue.includes('6')) {
                        peopleCount = 6;
                    }
                    
                    console.log(`Số người: ${peopleCount}`);
                    deductQuantity = quantity * peopleCount;
                    console.log(`Số lượng cần trừ sau khi tính toán: ${deductQuantity}`);
                } else {
                    console.warn('Không có thông tin kích thước phần ăn, sử dụng mặc định (2 người)');
                    deductQuantity = quantity * 2;
                }
                
                // Cập nhật số lượng
                const currentQuantity = parseInt(product.quantity) || 0;
                const newQuantity = Math.max(0, currentQuantity - deductQuantity);
                
                console.log(`Cập nhật sản phẩm ${product.ingredientName}: ${currentQuantity} - ${deductQuantity} = ${newQuantity}`);
                
                try {
                    await ingredientService.updateQuantity(productId, newQuantity);
                    console.log(`Đã cập nhật số lượng thành công cho sản phẩm ${product.ingredientName}`);
                } catch (updateError) {
                    console.error('Lỗi khi cập nhật số lượng:', updateError);
                    updateLog.updates.push({
                        productId,
                        productName: product.ingredientName,
                        previousQuantity: currentQuantity,
                        deductedQuantity: deductQuantity,
                        status: 'error',
                        message: updateError.message
                    });
                    continue;
                }
                
                // Lưu log
                updateLog.updates.push({
                    productId,
                    productName: product.ingredientName,
                    previousQuantity: currentQuantity,
                    deductedQuantity: deductQuantity,
                    newQuantity: newQuantity,
                    servingSize: servingSizeValue,
                    status: 'success'
                });
                
                // Kiểm tra ngưỡng tồn kho và tự động gửi thông báo nếu dưới ngưỡng
                if (newQuantity <= (product.minQuantity || 10)) {
                    console.log(`Cảnh báo: Sản phẩm ${product.ingredientName} dưới ngưỡng tồn kho (${newQuantity})`);
                    // TODO: Thêm code gửi thông báo cho admin
                }
            }
            
            console.log('Kết quả cập nhật kho:', updateLog);
            console.log('==== KẾT THÚC CẬP NHẬT KHO ====');
            
            // Lưu log vào database hoặc file nếu cần
            // TODO: Lưu log vào collection InventoryUpdateLogs
            
            return res.status(200).json({
                status: 'success',
                message: 'Cập nhật kho thành công',
                data: updateLog
            });
            
        } catch (error) {
            console.error('Lỗi khi cập nhật kho:', error);
            return res.status(500).json({
                status: 'error',
                message: 'Lỗi khi cập nhật kho: ' + error.message
            });
        }
    }
}

module.exports = new IngredientController(); 
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

            console.log(`🔄 Bắt đầu cập nhật kho cho đơn hàng ${orderId} với ${items.length} sản phẩm`);
            
            // Lưu log cập nhật kho
            const updateLog = {
                orderId,
                timestamp: new Date(),
                updates: []
            };

            // Cập nhật từng sản phẩm
            for (const item of items) {
                const { productId, quantity, servingSize } = item;
                
                console.log(`\n🔶 Đang xử lý sản phẩm: ID=${productId}, SL=${quantity}, Size=${servingSize}`);
                
                if (!productId || !quantity) {
                    console.warn(`❌ Dữ liệu sản phẩm không đầy đủ: ${JSON.stringify(item)}`);
                    updateLog.updates.push({
                        status: 'error',
                        message: 'Dữ liệu sản phẩm không đầy đủ',
                        item
                    });
                    continue;
                }
                
                try {
                    // Tìm sản phẩm theo ID
                    const Ingredient = require('../models/ingredient');
                    let product;
                    
                    try {
                        product = await Ingredient.findById(productId);
                    } catch (findError) {
                        console.error(`❌ Lỗi khi tìm sản phẩm ID=${productId}:`, findError);
                        updateLog.updates.push({
                            productId,
                            status: 'error',
                            message: `Lỗi khi tìm sản phẩm: ${findError.message}`
                        });
                        continue;
                    }
                    
                    if (!product) {
                        console.warn(`❌ Không tìm thấy sản phẩm ID: ${productId}`);
                        updateLog.updates.push({
                            productId,
                            status: 'error',
                            message: 'Không tìm thấy sản phẩm'
                        });
                        continue;
                    }
                    
                    console.log(`📦 Xử lý sản phẩm: ID=${productId}, Tên=${product.ingredientName}`);
                    
                    // Tìm khẩu phần cụ thể cần cập nhật
                    let portionUpdated = false;
                    let previousQuantity = 0;
                    let newQuantity = 0;
                    
                    if (product.pricePerPortion && Array.isArray(product.pricePerPortion)) {
                        console.log(`📊 Thông tin khẩu phần hiện tại:`, JSON.stringify(product.pricePerPortion, null, 2));
                        
                        // Chuẩn hóa servingSize từ input
                        const normalizedServingSize = servingSize ? servingSize.trim() : '';
                        console.log(`📝 servingSize cần tìm: "${normalizedServingSize}"`);
                        
                        // Hiển thị tất cả các khẩu phần có sẵn
                        product.pricePerPortion.forEach((p, idx) => {
                            console.log(`  • [${idx}] Khẩu phần: portion="${p.portion}", price=${p.price}, quantity=${p.quantity}`);
                        });
                        
                        // Tìm chính xác theo chuỗi servingSize
                        let portionIndex = product.pricePerPortion.findIndex(p => 
                            p.portion === normalizedServingSize
                        );
                        
                        // Nếu không tìm thấy và servingSize chỉ là số
                        if (portionIndex === -1 && /^\d+$/.test(normalizedServingSize)) {
                            console.log(`🔍 ServingSize chỉ có số "${normalizedServingSize}", tìm portion phù hợp`);
                            portionIndex = product.pricePerPortion.findIndex(p => 
                                p.portion === normalizedServingSize
                            );
                        }
                        
                        // Nếu vẫn không tìm thấy, tìm theo số trong servingSize
                        if (portionIndex === -1) {
                            const match = normalizedServingSize.match(/(\d+)/);
                            if (match) {
                                const numericPart = match[0];
                                console.log(`🔍 Tìm theo số: "${numericPart}"`);
                                
                                // Tìm khẩu phần có portion chính xác là số đó
                                portionIndex = product.pricePerPortion.findIndex(p => 
                                    p.portion === numericPart
                                );
                                
                                // Nếu vẫn không tìm thấy, tìm khẩu phần có chứa số đó
                                if (portionIndex === -1) {
                                    for (let i = 0; i < product.pricePerPortion.length; i++) {
                                        if (product.pricePerPortion[i].portion.includes(numericPart)) {
                                            portionIndex = i;
                                            console.log(`  ✅ Tìm thấy khẩu phần có chứa số "${numericPart}": "${product.pricePerPortion[i].portion}"`);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Nếu vẫn không tìm thấy và sản phẩm chỉ có một khẩu phần, sử dụng khẩu phần đó
                        if (portionIndex === -1 && product.pricePerPortion.length === 1) {
                            portionIndex = 0;
                            console.log(`⚠️ Không tìm thấy khẩu phần phù hợp, sản phẩm chỉ có một khẩu phần nên sử dụng khẩu phần duy nhất`);
                        }
                        
                        // Nếu vẫn không tìm thấy, dùng khẩu phần đầu tiên
                        if (portionIndex === -1 && product.pricePerPortion.length > 0) {
                            portionIndex = 0;
                            console.log(`⚠️ Không tìm thấy khẩu phần phù hợp, sử dụng khẩu phần đầu tiên`);
                        }
                        
                        console.log(`🔍 Kết quả tìm kiếm khẩu phần: ${portionIndex !== -1 ? `Tìm thấy ở vị trí ${portionIndex}: "${product.pricePerPortion[portionIndex].portion}"` : '❌ Không tìm thấy'}`);
                        
                        if (portionIndex !== -1) {
                            const portion = product.pricePerPortion[portionIndex];
                            previousQuantity = parseInt(portion.quantity) || 0;
                            
                            console.log(`📊 Khẩu phần ${portion.portion} hiện có số lượng: ${previousQuantity}`);
                            
                            // Trừ số lượng đã đặt
                            newQuantity = Math.max(0, previousQuantity - quantity);
                            
                            console.log(`📉 CẬP NHẬT TỒN KHO: Sản phẩm ID=${productId}, Khẩu phần="${portion.portion}": ${previousQuantity} - ${quantity} = ${newQuantity}`);
                            
                            // Cập nhật số lượng cho khẩu phần này
                            product.pricePerPortion[portionIndex].quantity = newQuantity;
                            portionUpdated = true;
                            
                            // Cập nhật tổng số lượng nếu sản phẩm có quantity bên ngoài
                            if (product.quantity !== undefined) {
                                const currentTotalQuantity = parseInt(product.quantity) || 0;
                                product.quantity = Math.max(0, currentTotalQuantity - quantity);
                                console.log(`📉 Cập nhật tổng số lượng chung: ${currentTotalQuantity} - ${quantity} = ${product.quantity}`);
                            }
                        }
                    } else {
                        console.log("⚠️ Sản phẩm không có thông tin khẩu phần, kiểm tra quantity chung");
                        // Nếu không có thông tin khẩu phần, kiểm tra trường quantity
                        if (product.quantity !== undefined) {
                            previousQuantity = parseInt(product.quantity) || 0;
                            console.log(`📊 Tổng số lượng chung hiện tại: ${previousQuantity}`);
                            
                            // Cập nhật quantity chung
                            newQuantity = Math.max(0, previousQuantity - quantity);
                            product.quantity = newQuantity;
                            console.log(`📉 Cập nhật tổng số lượng chung: ${previousQuantity} - ${quantity} = ${newQuantity}`);
                            
                            portionUpdated = true;
                        }
                    }
                    
                    // Nếu không tìm thấy khẩu phần cụ thể
                    if (!portionUpdated) {
                        console.log(`❌ Không tìm thấy khẩu phần phù hợp, không thực hiện cập nhật`);
                        updateLog.updates.push({
                            productId,
                            productName: product.ingredientName,
                            servingSize: servingSize || 'Mặc định',
                            status: 'warning',
                            message: 'Không tìm thấy khẩu phần'
                        });
                        continue;
                    }
                    
                    // Cập nhật trạng thái dựa trên số lượng của các khẩu phần
                    // Nếu có bất kỳ khẩu phần nào còn hàng (quantity > 0), đánh dấu còn hàng
                    const anyAvailable = product.pricePerPortion && Array.isArray(product.pricePerPortion) 
                        ? product.pricePerPortion.some(p => parseInt(p.quantity) > 0)
                        : (parseInt(product.quantity) > 0);
                    
                    product.status = anyAvailable ? 'Còn hàng' : 'Hết hàng';
                    
                    // Lưu sản phẩm
                    try {
                        // Sử dụng save với tùy chọn validateBeforeSave: false để bỏ qua validation
                        // hoặc sử dụng findByIdAndUpdate để chỉ cập nhật các trường cần thiết
                        const updateData = {
                            quantity: product.quantity,
                            pricePerPortion: product.pricePerPortion,
                            status: product.status,
                            updatedAt: new Date()
                        };
                        
                        // Sử dụng findByIdAndUpdate thay vì save để tránh validation
                        const updatedProduct = await Ingredient.findByIdAndUpdate(
                            productId,
                            updateData,
                            { new: true, runValidators: false }
                        );
                        
                        if (updatedProduct) {
                            console.log(`✅ Lưu sản phẩm ID=${productId} thành công`);
                        } else {
                            throw new Error("Không thể cập nhật sản phẩm");
                        }
                    } catch (saveError) {
                        console.error(`❌ Lỗi khi lưu sản phẩm ID=${productId}:`, saveError);
                        
                        // Xử lý đặc biệt cho lỗi validation
                        if (saveError.name === 'ValidationError') {
                            console.log(`⚠️ Lỗi validation, thử sử dụng phương thức khác để cập nhật`);
                            
                            try {
                                // Tiếp tục với phương thức updateOne để cập nhật trực tiếp fields mà không qua validation
                                await Ingredient.updateOne(
                                    { _id: productId },
                                    { 
                                        $set: {
                                            'quantity': product.quantity,
                                            'pricePerPortion': product.pricePerPortion,
                                            'status': product.status,
                                            'updatedAt': new Date()
                                        }
                                    }
                                );
                                console.log(`✅ Đã cập nhật tồn kho trực tiếp thành công cho ID=${productId}`);
                                portionUpdated = true; // Đánh dấu đã cập nhật thành công
                            } catch (updateError) {
                                console.error(`❌ Lỗi khi cập nhật trực tiếp: ${updateError.message}`);
                                updateLog.updates.push({
                                    productId,
                                    productName: product.ingredientName,
                                    status: 'error',
                                    message: `Lỗi khi cập nhật trực tiếp: ${updateError.message}`
                                });
                                continue;
                            }
                        } else {
                            updateLog.updates.push({
                                productId,
                                productName: product.ingredientName,
                                status: 'error',
                                message: `Lỗi khi lưu: ${saveError.message}`
                            });
                            continue;
                        }
                    }
                    
                    console.log(`\n✅ Đã cập nhật thành công số lượng cho sản phẩm ID=${productId}`);
                    
                    if (product.pricePerPortion && Array.isArray(product.pricePerPortion)) {
                        console.log('📊 Thông tin khẩu phần sau khi cập nhật:');
                        product.pricePerPortion.forEach(p => {
                            console.log(`  • ${p.portion}: ${p.quantity}`);
                        });
                    }
                    
                    // Lưu log
                    updateLog.updates.push({
                        productId,
                        productName: product.ingredientName,
                        previousQuantity: previousQuantity,
                        deductedQuantity: quantity,
                        newQuantity: newQuantity,
                        servingSize: servingSize || 'Mặc định',
                        status: 'success'
                    });
                    
                } catch (error) {
                    console.error(`❌ Lỗi khi xử lý sản phẩm ID=${productId}:`, error);
                    updateLog.updates.push({
                        productId,
                        deductedQuantity: quantity,
                        status: 'error',
                        message: error.message
                    });
                }
            }
            
            console.log('\n📊 KẾT QUẢ CẬP NHẬT KHO:');
            updateLog.updates.forEach(update => {
                if (update.status === 'success') {
                    console.log(`✅ ${update.productName}: Khẩu phần [${update.servingSize}] - Từ ${update.previousQuantity} giảm ${update.deductedQuantity} còn ${update.newQuantity}`);
                } else {
                    console.log(`❌ ${update.productId}: ${update.message}`);
                }
            });
            console.log('==== KẾT THÚC CẬP NHẬT KHO ====');
            
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
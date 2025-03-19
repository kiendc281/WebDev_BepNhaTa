const Cart = require('../models/cart');
const Ingredient = require('../models/ingredient');
const mongoose = require('mongoose');

class CartService {
    // Kiểm tra ID hợp lệ
    isValidObjectId(id) {
        return mongoose.Types.ObjectId.isValid(id);
    }

    // Lấy tất cả giỏ hàng
    async getAllCarts() {
        try {
            return await Cart.find()
                .populate('accountId', 'username email')
                .populate('items.productId', 'name price');
        } catch (error) {
            console.error('Lỗi khi lấy tất cả giỏ hàng:', error);
            throw new Error('Không thể lấy danh sách giỏ hàng');
        }
    }

    // Lấy giỏ hàng theo id
    async getCartById(cartId) {
        try {
            const cart = await Cart.findById(cartId)
                .populate('accountId', 'username email')
                .populate('items.productId', 'name price');
            
            if (!cart) {
                throw new Error('Không tìm thấy giỏ hàng');
            }
            
            return cart;
        } catch (error) {
            console.error(`Lỗi khi lấy giỏ hàng ID ${cartId}:`, error);
            throw new Error('Không tìm thấy giỏ hàng');
        }
    }

    // Lấy giỏ hàng theo accountId
    async getCartByAccountId(accountId) {
        try {
            const cart = await Cart.findOne({ accountId })
                .populate('accountId', 'username email')
                .populate('items.productId', 'name price');
            
            if (!cart) {
                throw new Error('Không tìm thấy giỏ hàng');
            }
            
            return cart;
        } catch (error) {
            console.error(`Lỗi khi lấy giỏ hàng cho tài khoản ${accountId}:`, error);
            throw new Error('Không tìm thấy giỏ hàng');
        }
    }

    // Lấy giỏ hàng người dùng hiện tại
    async getUserCart(userId) {
        try {
            console.log(`Lấy giỏ hàng cho user: ${userId}`);
            
            // Kiểm tra userId có giá trị hợp lệ không
            if (!userId || userId === 'undefined' || userId === 'null') {
                console.error('ID người dùng không được cung cấp hoặc không hợp lệ:', userId);
                throw new Error('ID người dùng không hợp lệ');
            }

            // Đảm bảo userId là string
            userId = String(userId);
            console.log(`Tìm giỏ hàng với accountId: ${userId}`);

            let cart = await Cart.findOne({ accountId: userId })
                .populate('items.productId');
            
            if (!cart) {
                console.log('Không tìm thấy giỏ hàng, tạo giỏ hàng mới');
                cart = new Cart({
                    accountId: userId,
                    items: [],
                    listCart: [],
                    totalQuantity: 0,
                    totalPrice: 0
                });
                await cart.save();
            }
            
            // Trả về cart với format đúng cho frontend
            console.log(`Đã tìm thấy giỏ hàng với ${cart.items ? cart.items.length : 0} sản phẩm`);
            
            // Nếu có items, sử dụng items, nếu không có, sử dụng listCart (cũ)
            if (!cart.items || cart.items.length === 0) {
                if (cart.listCart && cart.listCart.length > 0) {
                    // Chuyển đổi từ listCart sang items
                    const itemsFromListCart = await Promise.all(cart.listCart.map(async (item) => {
                        const ingredient = await Ingredient.findById(item.ingredientId);
                        if (ingredient) {
                            return {
                                productId: ingredient._id,
                                ingredientName: ingredient.ingredientName,
                                mainImage: ingredient.mainImage,
                                quantity: item.quantity,
                                servingSize: 'standard', // Giá trị mặc định
                                price: item.totalPrice / item.quantity
                            };
                        }
                        return null;
                    }));
                    
                    // Lọc bỏ các phần tử null
                    cart.items = itemsFromListCart.filter(item => item !== null);
                    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
                    cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    
                    await cart.save();
                }
            }
            
            return { 
                items: cart.items || [], 
                totalQuantity: cart.totalQuantity || 0, 
                totalPrice: cart.totalPrice || 0 
            };
        } catch (error) {
            console.error(`Lỗi khi lấy giỏ hàng cho user ${userId}:`, error);
            throw new Error('Không thể lấy giỏ hàng: ' + error.message);
        }
    }

    // Cập nhật giỏ hàng
    async updateCart(userId, cartData) {
        try {
            console.log(`Cập nhật giỏ hàng cho user: ${userId}`);
            console.log('Dữ liệu cập nhật:', cartData);
            
            if (!cartData.items || !Array.isArray(cartData.items)) {
                throw new Error('Items phải là một mảng');
            }

            // Tìm giỏ hàng của người dùng, nếu không có thì tạo mới
            let cart = await Cart.findOne({ accountId: userId });
            
            if (!cart) {
                console.log('Không tìm thấy giỏ hàng, tạo giỏ hàng mới');
                cart = new Cart({
                    accountId: userId,
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0
                });
            }
            
            // Cập nhật giỏ hàng với items từ request
            cart.items = cartData.items;
            
            // Tính toán lại tổng số lượng và tổng giá
            cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            console.log('Giỏ hàng trước khi lưu:', cart);
            await cart.save();
            console.log('Giỏ hàng đã lưu thành công');
            
            return { 
                items: cart.items, 
                totalQuantity: cart.totalQuantity, 
                totalPrice: cart.totalPrice 
            };
        } catch (error) {
            console.error(`Lỗi khi cập nhật giỏ hàng cho user ${userId}:`, error);
            throw new Error(`Lỗi khi cập nhật giỏ hàng: ${error.message}`);
        }
    }

    // Xóa giỏ hàng
    async clearCart(userId) {
        try {
            console.log(`Xóa giỏ hàng cho user: ${userId}`);
            
            const cart = await Cart.findOne({ accountId: userId });
            
            if (!cart) {
                console.log('Không tìm thấy giỏ hàng để xóa');
                return { 
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0
                };
            }
            
            // Xóa tất cả items trong giỏ hàng
            cart.items = [];
            cart.totalQuantity = 0;
            cart.totalPrice = 0;
            
            await cart.save();
            
            console.log('Đã xóa giỏ hàng thành công');
            return { 
                items: [],
                totalQuantity: 0,
                totalPrice: 0
            };
        } catch (error) {
            console.error(`Lỗi khi xóa giỏ hàng cho user ${userId}:`, error);
            throw new Error('Không thể xóa giỏ hàng');
        }
    }

    // Thêm sản phẩm vào giỏ hàng
    async addToCart(userId, productId, quantity, servingSize, price) {
        try {
            console.log(`Thêm sản phẩm vào giỏ hàng cho user: ${userId}`);
            console.log(`Thông tin sản phẩm: productId=${productId}, quantity=${quantity}, servingSize=${servingSize}, price=${price}`);
            
            // Kiểm tra userId có giá trị hợp lệ không
            if (!userId || userId === 'undefined' || userId === 'null') {
                console.error('ID người dùng không được cung cấp hoặc không hợp lệ:', userId);
                throw new Error('ID người dùng không hợp lệ');
            }
            
            // Đảm bảo productId là string trước khi kiểm tra
            productId = String(productId);
            
            // Tìm sản phẩm theo ID - hỗ trợ cả ID tùy chỉnh và MongoDB ObjectId
            let product;
            if (this.isValidObjectId(productId)) {
                product = await Ingredient.findById(productId);
            } else {
                // Tìm kiếm theo ID tùy chỉnh (ví dụ: GNL08)
                product = await Ingredient.findOne({ _id: productId });
                
                // Nếu không tìm thấy bằng _id, thử tìm bằng trường khác (ví dụ: ingredientId)
                if (!product) {
                    product = await Ingredient.findOne({ ingredientId: productId });
                }
            }
            
            if (!product) {
                console.error(`Không tìm thấy sản phẩm với ID: ${productId}`);
                throw new Error(`Không tìm thấy sản phẩm với ID ${productId}`);
            }
            
            console.log(`Đã tìm thấy sản phẩm: ${product.ingredientName}`);
            
            // Kiểm tra số lượng sản phẩm còn đủ không
            const isAvailable = await Ingredient.checkAvailableQuantity(productId, servingSize, quantity);
            if (!isAvailable) {
                console.error(`Sản phẩm ${productId} khẩu phần ${servingSize} không đủ số lượng ${quantity}`);
                throw new Error(`Sản phẩm không đủ số lượng`);
            }
            
            // Tìm hoặc tạo giỏ hàng
            let cart = await Cart.findOne({ accountId: userId });
            
            if (!cart) {
                console.log('Không tìm thấy giỏ hàng, tạo giỏ hàng mới');
                cart = new Cart({
                    accountId: userId,
                    items: [],
                    listCart: [],
                    totalQuantity: 0,
                    totalPrice: 0
                });
                await cart.save();
            }

            // Đảm bảo cart.items là một mảng
            if (!cart.items) {
                cart.items = [];
            }
            
            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            const existingItemIndex = cart.items.findIndex(
                item => {
                    // Kiểm tra cả trường hợp productId là ObjectId hoặc string
                    const itemProductId = item.productId ? (typeof item.productId === 'object' ? item.productId.toString() : item.productId) : '';
                    return itemProductId === product._id.toString() && item.servingSize === servingSize;
                }
            );
            
            if (existingItemIndex !== -1) {
                // Nếu sản phẩm đã tồn tại, cập nhật số lượng
                console.log('Sản phẩm đã tồn tại trong giỏ hàng, cập nhật số lượng');
                cart.items[existingItemIndex].quantity += quantity;
            } else {
                // Nếu sản phẩm chưa tồn tại, thêm mới
                console.log('Thêm sản phẩm mới vào giỏ hàng');
                cart.items.push({
                    productId,
                    ingredientName: product.ingredientName,
                    mainImage: product.mainImage,
                    quantity,
                    servingSize,
                    price
                });
            }
            
            // Cập nhật tổng số lượng và tổng giá
            cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            await cart.save();
            console.log('Đã cập nhật giỏ hàng thành công');
            
            return { 
                items: cart.items, 
                totalQuantity: cart.totalQuantity, 
                totalPrice: cart.totalPrice 
            };
        } catch (error) {
            console.error(`Lỗi khi thêm sản phẩm vào giỏ hàng cho user ${userId}:`, error);
            throw new Error(`Không thể thêm sản phẩm vào giỏ hàng: ${error.message}`);
        }
    }

    // Xóa sản phẩm khỏi giỏ hàng
    async removeFromCart(userId, productId, servingSize) {
        try {
            console.log(`Xóa sản phẩm khỏi giỏ hàng cho user: ${userId}`);
            console.log(`Thông tin sản phẩm: productId=${productId}, servingSize=${servingSize}`);
            
            // Đảm bảo userId là string
            userId = String(userId);
            // Đảm bảo productId là string
            productId = String(productId);
            
            // Tìm giỏ hàng
            const cart = await Cart.findOne({ accountId: userId });
            
            if (!cart) {
                throw new Error('Không tìm thấy giỏ hàng');
            }
            
            // Tìm vị trí sản phẩm trong giỏ hàng
            const itemIndex = cart.items.findIndex(item => {
                // Kiểm tra cả trường hợp productId là ObjectId hoặc string
                const itemProductId = item.productId ? (typeof item.productId === 'object' ? item.productId.toString() : item.productId) : '';
                return itemProductId === productId && item.servingSize === servingSize;
            });
            
            if (itemIndex === -1) {
                throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
            }

            // Lấy số lượng của sản phẩm trước khi xóa để hoàn lại vào kho
            const removedQuantity = cart.items[itemIndex].quantity;
            
            // Xóa sản phẩm khỏi mảng items
            cart.items.splice(itemIndex, 1);
            
            // Cập nhật tổng số lượng và tổng giá
            cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            await cart.save();
            console.log('Đã xóa sản phẩm khỏi giỏ hàng thành công');
            
            // Cập nhật lại số lượng sản phẩm trong kho (trả lại số lượng đã xóa)
            try {
                await Ingredient.updateQuantity(productId, servingSize, removedQuantity);
                console.log(`Đã hoàn lại số lượng ${removedQuantity} cho sản phẩm ${productId} khẩu phần ${servingSize}`);
            } catch (updateError) {
                console.error('Lỗi khi cập nhật lại số lượng sản phẩm:', updateError);
                // Không ảnh hưởng đến việc xóa giỏ hàng nên chỉ log lỗi
            }
            
            return { 
                items: cart.items, 
                totalQuantity: cart.totalQuantity, 
                totalPrice: cart.totalPrice 
            };
        } catch (error) {
            console.error(`Lỗi khi xóa sản phẩm khỏi giỏ hàng cho user ${userId}:`, error);
            throw new Error(`Không thể xóa sản phẩm khỏi giỏ hàng: ${error.message}`);
        }
    }
}

module.exports = new CartService(); 
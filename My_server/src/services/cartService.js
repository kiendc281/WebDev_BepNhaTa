const Cart = require('../models/cart');
const Ingredient = require('../models/ingredient');

class CartService {
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
            
            let cart = await Cart.findOne({ accountId: userId })
                .populate('items.productId');
            
            if (!cart) {
                console.log('Không tìm thấy giỏ hàng, trả về giỏ hàng trống');
                return { 
                    items: [], 
                    totalQuantity: 0, 
                    totalPrice: 0 
                };
            }
            
            console.log(`Đã tìm thấy giỏ hàng với ${cart.items.length} sản phẩm`);
            return { 
                items: cart.items, 
                totalQuantity: cart.totalQuantity, 
                totalPrice: cart.totalPrice 
            };
        } catch (error) {
            console.error(`Lỗi khi lấy giỏ hàng cho user ${userId}:`, error);
            throw new Error('Không thể lấy giỏ hàng');
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
            
            // Kiểm tra sản phẩm tồn tại
            const product = await Ingredient.findById(productId);
            if (!product) {
                throw new Error(`Không tìm thấy sản phẩm với ID ${productId}`);
            }
            
            // Tìm hoặc tạo giỏ hàng
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
            
            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            const existingItemIndex = cart.items.findIndex(
                item => item.productId.toString() === productId && item.servingSize === servingSize
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
            
            // Tìm giỏ hàng
            const cart = await Cart.findOne({ accountId: userId });
            
            if (!cart) {
                throw new Error('Không tìm thấy giỏ hàng');
            }
            
            // Tìm vị trí sản phẩm trong giỏ hàng
            const itemIndex = cart.items.findIndex(
                item => item.productId.toString() === productId && item.servingSize === servingSize
            );
            
            if (itemIndex === -1) {
                throw new Error('Không tìm thấy sản phẩm trong giỏ hàng');
            }
            
            // Xóa sản phẩm khỏi mảng items
            cart.items.splice(itemIndex, 1);
            
            // Cập nhật tổng số lượng và tổng giá
            cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cart.totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            await cart.save();
            console.log('Đã xóa sản phẩm khỏi giỏ hàng thành công');
            
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
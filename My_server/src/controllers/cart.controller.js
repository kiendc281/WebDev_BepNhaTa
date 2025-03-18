const cartService = require('../services/cartService');
const Ingredient = require('../models/ingredient');

const cartController = {
    // Lấy tất cả giỏ hàng
    getAllCarts: async (req, res) => {
        try {
            const carts = await cartService.getAllCarts();
            res.json(carts);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Lấy giỏ hàng theo id
    getCartById: async (req, res) => {
        try {
            const cart = await cartService.getCartById(req.params.id);
            res.json(cart);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    },

    // Lấy giỏ hàng theo accountId
    getCartByAccountId: async (req, res) => {
        try {
            const cart = await cartService.getCartByAccountId(req.params.accountId);
            res.json(cart);
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    },

    // Lấy giỏ hàng người dùng hiện tại
    getUserCart: async (req, res) => {
        try {
            // Lấy userId từ request nếu có authentication, hoặc từ query nếu không
            const userId = req.user?.id || req.query.userId;
            
            if (!userId) {
                return res.status(400).json({ message: 'Cần có userId để lấy giỏ hàng' });
            }
            
            const cart = await cartService.getUserCart(userId);
            res.json(cart);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Cập nhật giỏ hàng
    updateUserCart: async (req, res) => {
        try {
            // Lấy userId từ request nếu có authentication, hoặc từ body nếu không
            const userId = req.user?.id || req.body.userId;
            
            if (!userId) {
                return res.status(400).json({ message: 'Cần có userId để cập nhật giỏ hàng' });
            }
            
            const updatedCart = await cartService.updateCart(userId, req.body);
            res.json(updatedCart);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Xóa giỏ hàng
    clearUserCart: async (req, res) => {
        try {
            // Lấy userId từ request nếu có authentication, hoặc từ query nếu không
            const userId = req.user?.id || req.query.userId;
            
            if (!userId) {
                return res.status(400).json({ message: 'Cần có userId để xóa giỏ hàng' });
            }
            
            const emptyCart = await cartService.clearCart(userId);
            res.json(emptyCart);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Thêm sản phẩm vào giỏ hàng
    addToCart: async (req, res) => {
        try {
            const { userId, productId, quantity, servingSize, price } = req.body;
            console.log('Request body for addToCart:', req.body);
            
            if (!userId || !productId || !quantity || !servingSize || !price) {
                return res.status(400).json({ 
                    message: 'Cần có đầy đủ thông tin: userId, productId, quantity, servingSize, price',
                    received: { userId, productId, quantity, servingSize, price }
                });
            }
            
            const updatedCart = await cartService.addToCart(
                String(userId), String(productId), Number(quantity), String(servingSize), Number(price)
            );
            res.json(updatedCart);
        } catch (error) {
            console.error('Error in addToCart controller:', error);
            res.status(400).json({ message: error.message });
        }
    },

    // Xóa sản phẩm khỏi giỏ hàng
    removeFromCart: async (req, res) => {
        try {
            const { userId, productId, servingSize } = req.body;
            
            if (!userId || !productId || !servingSize) {
                return res.status(400).json({ 
                    message: 'Cần có đầy đủ thông tin: userId, productId, servingSize' 
                });
            }
            
            const updatedCart = await cartService.removeFromCart(userId, productId, servingSize);
            res.json(updatedCart);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
};

module.exports = cartController; 
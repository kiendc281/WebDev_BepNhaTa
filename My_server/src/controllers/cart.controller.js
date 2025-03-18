const Cart = require('../models/cart');
const Ingredient = require('../models/ingredient');

const cartController = {
    // Lấy tất cả giỏ hàng
    getAllCarts: async (req, res) => {
        try {
            const carts = await Cart.find()
                .populate('accountId', 'username email')
                .populate('listCart.ingredientId', 'name price');
            res.json(carts);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Lấy giỏ hàng theo id
    getCartById: async (req, res) => {
        try {
            const cart = await Cart.findById(req.params.id)
                .populate('accountId', 'username email')
                .populate('listCart.ingredientId', 'name price');
            if (!cart) {
                return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
            }
            res.json(cart);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Lấy giỏ hàng theo accountId
    getCartByAccountId: async (req, res) => {
        try {
            const cart = await Cart.findOne({ accountId: req.params.accountId })
                .populate('accountId', 'username email')
                .populate('listCart.ingredientId', 'name price');
            if (!cart) {
                return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
            }
            res.json(cart);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Tạo giỏ hàng mới
    createCart: async (req, res) => {
        try {
            const { accountId, listCart } = req.body;

            // Kiểm tra xem khách hàng đã có giỏ hàng chưa
            let existingCart = await Cart.findOne({ accountId });

            if (existingCart) {
                // Nếu đã có giỏ hàng, xử lý từng sản phẩm mới
                for (let newItem of listCart) {
                    const ingredient = await Ingredient.findById(newItem.ingredientId);
                    if (!ingredient) {
                        return res.status(404).json({ 
                            message: `Không tìm thấy nguyên liệu với id ${newItem.ingredientId}` 
                        });
                    }

                    // Tìm giá theo khẩu phần
                    const portionInfo = ingredient.pricePerPortion.find(p => p.portion === newItem.portion);
                    if (!portionInfo) {
                        return res.status(400).json({ 
                            message: `Không tìm thấy giá cho khẩu phần ${newItem.portion} của nguyên liệu ${newItem.ingredientId}` 
                        });
                    }

                    // Tìm sản phẩm trong giỏ hàng hiện tại
                    const existingItemIndex = existingCart.listCart.findIndex(item => 
                        item.ingredientId && 
                        item.ingredientId.toString() === newItem.ingredientId &&
                        item.portion === newItem.portion
                    );

                    if (existingItemIndex !== -1) {
                        // Nếu đã có, cộng dồn số lượng
                        existingCart.listCart[existingItemIndex].quantity += newItem.quantity;
                        existingCart.listCart[existingItemIndex].totalPrice = 
                            portionInfo.price * existingCart.listCart[existingItemIndex].quantity;
                    } else {
                        // Nếu chưa có, thêm mới
                        existingCart.listCart.push({
                            ingredientId: newItem.ingredientId,
                            quantity: newItem.quantity,
                            portion: newItem.portion,
                            totalPrice: portionInfo.price * newItem.quantity
                        });
                    }

                    console.log('Existing cart:', existingCart);
                    console.log('New item:', newItem);
                    console.log('Found item:', existingCart.listCart[existingItemIndex]);
                }

                // Gộp các sản phẩm giống nhau
                const groupedCart = [];
                existingCart.listCart.forEach(item => {
                    if (!item.ingredientId) return; // Bỏ qua item không có ingredientId

                    const existingItem = groupedCart.find(g => 
                        g.ingredientId && 
                        g.ingredientId.toString() === item.ingredientId.toString() &&
                        g.portion === item.portion
                    );

                    if (existingItem) {
                        existingItem.quantity += item.quantity;
                        existingItem.totalPrice += item.totalPrice;
                    } else {
                        groupedCart.push({...item.toObject()}); // Chuyển đổi Mongoose document thành plain object
                    }
                });

                // Cập nhật lại giỏ hàng
                existingCart.listCart = groupedCart;
                const updatedCart = await existingCart.save();
                return res.status(200).json(updatedCart);
            } else {
                // Nếu chưa có giỏ hàng, tạo mới như cũ
                for (let item of listCart) {
                    const ingredient = await Ingredient.findById(item.ingredientId);
                    if (!ingredient) {
                        return res.status(404).json({ 
                            message: `Không tìm thấy nguyên liệu với id ${item.ingredientId}` 
                        });
                    }
                    
                    const portionInfo = ingredient.pricePerPortion.find(p => p.portion === item.portion);
                    if (!portionInfo) {
                        return res.status(400).json({ 
                            message: `Không tìm thấy giá cho khẩu phần ${item.portion} của nguyên liệu ${item.ingredientId}` 
                        });
                    }
                    
                    item.totalPrice = portionInfo.price * item.quantity;
                }

                const cart = new Cart({
                    accountId,
                    listCart
                });

                const savedCart = await cart.save();
                return res.status(201).json(savedCart);
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(400).json({ message: error.message });
        }
    },

    // Cập nhật giỏ hàng
    updateCart: async (req, res) => {
        try {
            const { listCart } = req.body;

            // Tính toán totalPrice cho mỗi sản phẩm trong listCart
            for (let item of listCart) {
                const ingredient = await Ingredient.findById(item.ingredientId);
                if (!ingredient) {
                    return res.status(404).json({ 
                        message: `Không tìm thấy sản phẩm với id ${item.ingredientId}` 
                    });
                }
                
                // Lấy portion từ request
                const portion = item.portion || '2'; // mặc định là '2' nếu không có
                const price = ingredient.pricePerPortion[portion];
                
                if (!price || typeof price !== 'number') {
                    return res.status(400).json({ 
                        message: `Giá của nguyên liệu ${item.ingredientId} với portion ${portion} không hợp lệ` 
                    });
                }
                
                item.totalPrice = price * item.quantity;
            }

            const updatedCart = await Cart.findByIdAndUpdate(
                req.params.id,
                { $set: { listCart } },
                { new: true }
            ).populate('accountId', 'username email')
                .populate('listCart.ingredientId', 'name price');

            if (!updatedCart) {
                return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
            }

            res.json(updatedCart);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Thêm sản phẩm vào giỏ hàng
    addToCart: async (req, res) => {
        try {
            const { ingredientId, quantity } = req.body;
            const cart = await Cart.findById(req.params.id);

            if (!cart) {
                return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
            }

            const ingredient = await Ingredient.findById(ingredientId);
            if (!ingredient) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
            }

            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            const existingItem = cart.listCart.find(item => item.ingredientId.toString() === ingredientId);

            if (existingItem) {
                existingItem.quantity += quantity;
                existingItem.totalPrice = ingredient.pricePerPortion.price * existingItem.quantity;
            } else {
                cart.listCart.push({
                    ingredientId,
                    quantity,
                    totalPrice: ingredient.pricePerPortion.price * quantity
                });
            }

            const updatedCart = await cart.save();
            res.json(updatedCart);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Xóa sản phẩm khỏi giỏ hàng
    removeFromCart: async (req, res) => {
        try {
            const { ingredientId } = req.body;
            const cart = await Cart.findById(req.params.id);

            if (!cart) {
                return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
            }

            cart.listCart = cart.listCart.filter(item => item.ingredientId.toString() !== ingredientId);
            const updatedCart = await cart.save();
            res.json(updatedCart);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Xóa giỏ hàng
    deleteCart: async (req, res) => {
        try {
            const deletedCart = await Cart.findByIdAndDelete(req.params.id);
            if (!deletedCart) {
                return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
            }
            res.json({ message: "Đã xóa giỏ hàng thành công" });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    // Get the cart for the authenticated user
    getUserCart: async (req, res) => {
        try {
            const accountId = req.user.id;

            // Find or create cart for this user
            let cart = await Cart.findOne({ accountId });

            if (!cart) {
                // If no cart exists, return empty cart
                return res.json({ 
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0
                });
            }

            // Calculate totals (as a safety check)
            const totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            const totalPrice = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            // Update totals if they don't match
            if (cart.totalQuantity !== totalQuantity || cart.totalPrice !== totalPrice) {
                cart.totalQuantity = totalQuantity;
                cart.totalPrice = totalPrice;
                await cart.save();
            }

            res.json({ items: cart.items, totalQuantity, totalPrice });
        } catch (error) {
            console.error('Error fetching user cart:', error);
            res.status(500).json({ message: "Error fetching cart", error: error.message });
        }
    },

    // Update the cart for the authenticated user (create if doesn't exist)
    updateUserCart: async (req, res) => {
        try {
            const accountId = req.user.id;
            const { items } = req.body;

            if (!Array.isArray(items)) {
                return res.status(400).json({ message: "Items must be an array" });
            }

            let cart = await Cart.findOne({ accountId });
            
            if (!cart) {
                // Create new cart if it doesn't exist
                cart = new Cart({ 
                    accountId,
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0
                });
            }
            
            // Replace the entire items array
            cart.items = items;
            
            // Calculate totals
            cart.totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
            cart.totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            await cart.save();
            
            res.json({ items: cart.items, totalQuantity: cart.totalQuantity, totalPrice: cart.totalPrice });
        } catch (error) {
            console.error('Error updating cart:', error);
            res.status(500).json({ message: "Error updating cart", error: error.message });
        }
    },

    // Clear the cart for the authenticated user
    clearUserCart: async (req, res) => {
        try {
            const accountId = req.user.id;
            
            const cart = await Cart.findOne({ accountId });
            
            if (!cart) {
                return res.json({ 
                    items: [],
                    totalQuantity: 0,
                    totalPrice: 0
                });
            }
            
            // Clear items and reset totals
            cart.items = [];
            cart.totalQuantity = 0;
            cart.totalPrice = 0;
            
            await cart.save();
            
            res.json({ 
                items: [],
                totalQuantity: 0,
                totalPrice: 0
            });
        } catch (error) {
            console.error('Error clearing cart:', error);
            res.status(500).json({ message: "Error clearing cart", error: error.message });
        }
    }
};

module.exports = cartController; 
const Cart = require('../models/cart');
const Ingredient = require('../models/ingredient');

const cartController = {
    // Lấy tất cả giỏ hàng
    getAllCarts: async (req, res) => {
        try {
            const carts = await Cart.find()
                .populate('accountId', 'username email')
                .populate('listCart.productId', 'name price');
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
                .populate('listCart.productId', 'name price');
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
                .populate('listCart.productId', 'name price');
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

            // Tính toán totalPrice cho mỗi sản phẩm trong listCart
            for (let item of listCart) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    return res.status(404).json({ message: `Không tìm thấy sản phẩm với id ${item.productId}` });
                }
                item.totalPrice = product.price * item.quantity;
            }

            const cart = new Cart({
                accountId,
                listCart
            });

            const savedCart = await cart.save();
            res.status(201).json(savedCart);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    },

    // Cập nhật giỏ hàng
    updateCart: async (req, res) => {
        try {
            const { listCart } = req.body;

            // Tính toán totalPrice cho mỗi sản phẩm trong listCart
            for (let item of listCart) {
                const product = await Product.findById(item.productId);
                if (!product) {
                    return res.status(404).json({ message: `Không tìm thấy sản phẩm với id ${item.productId}` });
                }
                item.totalPrice = product.price * item.quantity;
            }

            const updatedCart = await Cart.findByIdAndUpdate(
                req.params.id,
                { $set: { listCart } },
                { new: true }
            ).populate('accountId', 'username email')
                .populate('listCart.productId', 'name price');

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
            const { productId, quantity } = req.body;
            const cart = await Cart.findById(req.params.id);

            if (!cart) {
                return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
            }

            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
            }

            // Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
            const existingItem = cart.listCart.find(item => item.productId.toString() === productId);

            if (existingItem) {
                existingItem.quantity += quantity;
                existingItem.totalPrice = product.price * existingItem.quantity;
            } else {
                cart.listCart.push({
                    productId,
                    quantity,
                    totalPrice: product.price * quantity
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
            const { productId } = req.body;
            const cart = await Cart.findById(req.params.id);

            if (!cart) {
                return res.status(404).json({ message: "Không tìm thấy giỏ hàng" });
            }

            cart.listCart = cart.listCart.filter(item => item.productId.toString() !== productId);
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
    }
};

module.exports = cartController; 
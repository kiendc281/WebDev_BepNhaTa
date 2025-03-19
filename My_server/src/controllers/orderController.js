const Order = require('../models/order');
const mongoose = require('mongoose');

/**
 * Lấy tất cả đơn hàng
 */
exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .sort({ orderDate: -1 })
            .populate('addressId');
        
        return res.status(200).json({
            status: 'success',
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy danh sách đơn hàng: ' + error.message
        });
    }
};

/**
 * Lấy đơn hàng theo ID
 */
exports.getOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID đơn hàng không được để trống'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID đơn hàng không hợp lệ'
            });
        }

        const order = await Order.findById(id).populate('addressId');
        
        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Đơn hàng không tồn tại'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: order
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin đơn hàng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy thông tin đơn hàng: ' + error.message
        });
    }
};

/**
 * Lấy đơn hàng theo accountId
 */
exports.getOrdersByUser = async (req, res) => {
    try {
        const { accountId } = req.params;
        
        if (!accountId) {
            return res.status(400).json({
                status: 'error',
                message: 'ID tài khoản không được để trống'
            });
        }

        const orders = await Order.find({ accountId })
            .sort({ orderDate: -1 })
            .populate('addressId');
        
        return res.status(200).json({
            status: 'success',
            count: orders.length,
            data: orders
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng của người dùng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi lấy danh sách đơn hàng của người dùng: ' + error.message
        });
    }
};

/**
 * Tạo đơn hàng mới
 */
exports.createOrder = async (req, res) => {
    try {
        const {
            accountId,
            itemOrder,
            prePrice,
            discount,
            shippingFee,
            totalPrice,
            addressId,
            shipDate,
            paymentMethod,
            status
        } = req.body;

        // Kiểm tra các trường bắt buộc
        if (!accountId || !itemOrder || !prePrice || !totalPrice || !addressId || !paymentMethod) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng nhập đầy đủ thông tin đơn hàng'
            });
        }

        // Kiểm tra addressId có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID địa chỉ không hợp lệ'
            });
        }

        // Tạo đơn hàng mới
        const newOrder = new Order({
            accountId,
            itemOrder,
            prePrice,
            discount: discount || 0,
            shippingFee,
            totalPrice,
            addressId,
            shipDate,
            paymentMethod,
            status: status || 'Đang xử lý'
        });

        // Lưu vào database
        const savedOrder = await newOrder.save();
        
        return res.status(201).json({
            status: 'success',
            message: 'Tạo đơn hàng thành công',
            data: savedOrder
        });
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi tạo đơn hàng: ' + error.message
        });
    }
};

/**
 * Cập nhật trạng thái đơn hàng
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID đơn hàng không được để trống'
            });
        }

        if (!status) {
            return res.status(400).json({
                status: 'error',
                message: 'Trạng thái đơn hàng không được để trống'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID đơn hàng không hợp lệ'
            });
        }

        // Kiểm tra đơn hàng có tồn tại không
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Đơn hàng không tồn tại'
            });
        }

        // Cập nhật trạng thái đơn hàng
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { 
                status,
                shipDate: status === 'Đã giao' ? new Date() : order.shipDate
            },
            { new: true }
        );
        
        return res.status(200).json({
            status: 'success',
            message: 'Cập nhật trạng thái đơn hàng thành công',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi cập nhật trạng thái đơn hàng: ' + error.message
        });
    }
};

/**
 * Hủy đơn hàng
 */
exports.cancelOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                status: 'error',
                message: 'ID đơn hàng không được để trống'
            });
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID đơn hàng không hợp lệ'
            });
        }

        // Kiểm tra đơn hàng có tồn tại không
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({
                status: 'error',
                message: 'Đơn hàng không tồn tại'
            });
        }

        // Kiểm tra xem đơn hàng có thể hủy không
        if (!['Đang xử lý', 'Đã xác nhận'].includes(order.status)) {
            return res.status(400).json({
                status: 'error',
                message: 'Không thể hủy đơn hàng ở trạng thái này'
            });
        }

        // Cập nhật trạng thái đơn hàng thành "Đã hủy"
        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status: 'Đã hủy' },
            { new: true }
        );
        
        return res.status(200).json({
            status: 'success',
            message: 'Hủy đơn hàng thành công',
            data: updatedOrder
        });
    } catch (error) {
        console.error('Lỗi khi hủy đơn hàng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi hủy đơn hàng: ' + error.message
        });
    }
}; 
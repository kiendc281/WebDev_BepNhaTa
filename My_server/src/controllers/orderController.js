const Order = require('../models/order');
const mongoose = require('mongoose');

/**
 * Tạo đơn hàng mới (chung cho cả khách và người dùng đã đăng nhập)
 */
exports.createOrder = async (req, res) => {
    try {
        console.log('Đang tạo đơn hàng với dữ liệu:', req.body);
        
        // Xác định loại đơn hàng dựa vào accountId
        if (req.body.accountId === 'guest') {
            console.log('Đơn hàng khách vãng lai, chuyển đến createGuestOrder');
            return await exports.createGuestOrder(req, res);
        } else {
            console.log('Đơn hàng người dùng đã đăng nhập, tiếp tục xử lý');
            // TODO: Xử lý đơn hàng cho người dùng đã đăng nhập
            // Hiện tại chuyển đến createGuestOrder để xử lý
            return await exports.createGuestOrder(req, res);
        }
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi tạo đơn hàng: ' + error.message
        });
    }
};

/**
 * Tạo đơn hàng mới cho khách vãng lai
 */
exports.createGuestOrder = async (req, res) => {
    try {
        const {
            accountId,
            itemOrder,
            prePrice,
            discount,
            shippingFee,
            totalPrice,
            paymentMethod,
            status,
            guestInfo
        } = req.body;

        console.log('Xử lý đơn hàng khách vãng lai với thông tin:', {
            itemOrder, prePrice, totalPrice, paymentMethod, guestInfo
        });

        // Kiểm tra các trường bắt buộc cơ bản
        if (!itemOrder || !prePrice || !totalPrice || !paymentMethod) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng nhập đầy đủ thông tin đơn hàng cơ bản'
            });
        }

        // Kiểm tra thông tin sản phẩm trong đơn hàng
        if (!Array.isArray(itemOrder) || itemOrder.length === 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Đơn hàng phải có ít nhất một sản phẩm'
            });
        }

        // Kiểm tra từng sản phẩm trong đơn hàng có đủ thông tin không
        for (const item of itemOrder) {
            if (!item.productId || !item.name || !item.img || !item.quantity || !item.totalPrice || !item.servingSize) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Thông tin sản phẩm trong đơn hàng không đầy đủ'
                });
            }
        }

        // Kiểm tra thông tin khách vãng lai cơ bản - Chỉ yêu cầu tên và số điện thoại
        if (!guestInfo || !guestInfo.fullName || !guestInfo.phone) {
            return res.status(400).json({
                status: 'error',
                message: 'Vui lòng cung cấp họ tên và số điện thoại'
            });
        }

        // Xử lý địa chỉ nếu thiếu quận/huyện, phường/xã
        const address = guestInfo.address || '';
        // Loại bỏ các phần trống trong địa chỉ (các dấu phẩy liên tiếp)
        const cleanedAddress = address.replace(/,\s*,+/g, ',').replace(/^,|,$/g, '');
        
        // Cập nhật lại địa chỉ đã làm sạch
        const updatedGuestInfo = {
            ...guestInfo,
            address: cleanedAddress || 'Không có địa chỉ cụ thể'
        };

        // Tạo đơn hàng mới cho khách vãng lai
        const newOrder = new Order({
            accountId: accountId || 'guest', // Sử dụng guest làm accountId mặc định
            itemOrder,
            prePrice,
            discount: discount || 0,
            shippingFee: shippingFee || 0,
            totalPrice,
            paymentMethod,
            status: status || 'Đang xử lý',
            guestInfo: updatedGuestInfo
        });

        // Lưu vào database
        const savedOrder = await newOrder.save();
        
        console.log('Đã tạo đơn hàng thành công:', savedOrder._id);
        
        return res.status(201).json({
            status: 'success',
            message: 'Tạo đơn hàng khách vãng lai thành công',
            data: savedOrder
        });
    } catch (error) {
        console.error('Lỗi khi tạo đơn hàng khách vãng lai:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Lỗi khi tạo đơn hàng khách vãng lai: ' + error.message
        });
    }
};

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
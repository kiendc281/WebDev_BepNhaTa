const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema cho item trong đơn hàng
const orderItemSchema = new Schema({
    productId: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    }
});

// Schema cho đơn hàng
const orderSchema = new Schema({
    accountId: {
        type: String,
        required: true
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    itemOrder: [orderItemSchema],
    prePrice: {
        type: Number,
        required: true,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    shippingFee: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    addressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    shipDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD'] // Có thể thêm các phương thức khác sau
    },
    status: {
        type: String,
        required: true,
        enum: ['Đang xử lý', 'Đã xác nhận', 'Đang giao hàng', 'Đã giao', 'Đã hủy'],
        default: 'Đang xử lý'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Tạo index để tìm kiếm nhanh hơn
orderSchema.index({ accountId: 1, orderDate: -1 });

// Cập nhật thời gian khi update
orderSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 
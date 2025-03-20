const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema cho item trong đơn hàng
const orderItemSchema = new Schema({
    productId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    img: {
        type: String,
        required: true
    },
    servingSize: {
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

// Schema cho thông tin khách vãng lai
const guestInfoSchema = new Schema({
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    address: {
        type: String,
        required: true
    },
    note: {
        type: String,
        required: false
    }
});

// Schema cho đơn hàng
const orderSchema = new Schema({
    accountId: {
        type: String,
        required: false // Không bắt buộc để hỗ trợ khách vãng lai
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
        required: false // Không bắt buộc để hỗ trợ khách vãng lai
    },
    // Thông tin khách vãng lai (chỉ yêu cầu khi không có addressId)
    guestInfo: {
        type: guestInfoSchema,
        required: function() {
            return !this.addressId; // Bắt buộc có guestInfo nếu không có addressId
        }
    },
    shipDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['COD', 'BANK'] // Có thể thêm các phương thức khác sau
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
orderSchema.index({ 'guestInfo.phone': 1 }); // Thêm index cho số điện thoại khách vãng lai

// Middleware để validate đơn hàng
orderSchema.pre('save', function(next) {
    // Kiểm tra phải có ít nhất một trong hai: addressId hoặc guestInfo
    if (!this.addressId && !this.guestInfo) {
        next(new Error('Đơn hàng phải có địa chỉ giao hàng hoặc thông tin khách vãng lai'));
    }
    next();
});

// Cập nhật thời gian khi update
orderSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 
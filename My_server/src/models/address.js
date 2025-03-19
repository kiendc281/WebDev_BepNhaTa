const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Tạo schema cho địa chỉ
const addressSchema = new Schema({
    accountId: {
        type: String,
        required: true
    },
    recipientName: {
        type: String,
        required: true
    },
    recipientPhone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false
    },
    city: {
        type: String,
        required: true
    },
    district: {
        type: String,
        required: true
    },
    ward: {
        type: String,
        required: true
    },
    detail: {
        type: String,
        required: true
    },
    isDefault: {
        type: Boolean,
        default: false
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
addressSchema.index({ accountId: 1 });

// Đặt thời gian updatedAt khi cập nhật
addressSchema.pre('findOneAndUpdate', function() {
    this.set({ updatedAt: new Date() });
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address; 
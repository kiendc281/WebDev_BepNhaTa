const mongoose = require('mongoose');

// Hàm tạo ID tự động
async function generateCustomId() {
    const prefix = 'AC';
    // Tìm document cuối cùng
    const lastAccount = await mongoose.model('Account').findOne({}, {}, { sort: { '_id': -1 } });

    if (!lastAccount || !lastAccount._id) {
        // Nếu chưa có account nào, bắt đầu từ AC01
        return `${prefix}01`;
    }

    // Lấy số từ ID cuối cùng và tăng lên 1
    const lastNumber = parseInt(lastAccount._id.substring(2));
    const nextNumber = lastNumber + 1;
    // Format số thành chuỗi 2 chữ số (01, 02, ..., 99)
    const formattedNumber = nextNumber.toString().padStart(2, '0');
    return `${prefix}${formattedNumber}`;
}

const accountSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    birthOfDate: {
        type: Date
    },
    gender: {
        type: String
    },
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { versionKey: false });

// Middleware để đảm bảo ID được tạo trước khi lưu
accountSchema.pre('save', async function (next) {
    try {
        if (this.isNew) {
            this._id = await generateCustomId();
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Account', accountSchema); 
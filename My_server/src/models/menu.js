const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    menuName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    mainImage: {
        type: String,
        required: true
    },
    subImage: String,
    category: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    ingredients: [{
        type: String,
        ref: 'Ingredient'
    }],
    price: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        min: 0,
        max: 100
    },
    status: {
        type: String,
        enum: ['Còn hàng', 'Hết hàng', 'Ngừng kinh doanh'],
        default: 'Còn hàng'
    }
}, { 
    timestamps: true,
    versionKey: false,
    collection: 'menu' // Chỉ định rõ tên collection
});

// Middleware tự động tạo ID
menuSchema.pre('save', async function(next) {
    try {
        if (this.isNew) {
            const lastMenu = await this.constructor.findOne({}, {}, { sort: { '_id': -1 } });
            const nextNumber = lastMenu ? parseInt(lastMenu._id.slice(2)) + 1 : 1;
            this._id = `MN${nextNumber.toString().padStart(2, '0')}`;
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Menu', menuSchema);
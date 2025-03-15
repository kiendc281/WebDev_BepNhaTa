const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
    _id: {
        type: String
    },
    ingredientName: {
        type: String,
        required: true
    },
    mainImage: {
        type: String,
        required: true
    },
    subImage: {
        type: String
    },
    combo: {
        type: String
    },
    discount: {
        type: Number,
        min: 0,
        max: 100
    },
    pricePerPortion: [{
        price: {
            type: Number,
            required: true
        },
        portion: {
            type: String,
            required: true
        }
    }],
    description: {
        type: String,
        required: true
    },
    notes: String,
    components: [{
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number
        },
        unit: {
            type: String
        },
        notes: String,
        _id: String
    }],
    storage: {
        type: String,
        required: true
    },
    expirationDate: {
        type: Date,
        required: true
    },
    tags: [{
        type: String
    }],
    relatedProductIds: [{
        type: String,
        ref: 'Ingredient'
    }],
    suggestedRecipeIds: [{
        type: String,
        ref: 'Recipe'
    }],
    region: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    level: {
        type: String,
        enum: ['Dễ', 'Trung bình', 'Khó'],
        // default: 'Trung bình'
    },
    time: {
        type: String,
        // default: '25 phút'
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ['Còn hàng', 'Hết hàng', 'Ngừng kinh doanh'],
        default: 'Còn hàng'
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

// Middleware để tự động tạo ID
ingredientSchema.pre('save', async function(next) {
    try {
        if (this.isNew) {
            const lastIngredient = await this.constructor.findOne({}, {}, { sort: { '_id': -1 } });
            const nextNumber = lastIngredient ? parseInt(lastIngredient._id.slice(3)) + 1 : 1;
            this._id = `GNL${nextNumber.toString().padStart(2, '0')}`;
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('Ingredient', ingredientSchema); 
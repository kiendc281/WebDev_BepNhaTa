// Thêm một console.log để xem schema
console.log('Loading ingredient schema...');

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
        },
        quantity: {
            type: Number,
            default: 0,
            min: 0
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
        min: 0,
        default: 0 // Đánh dấu không bắt buộc, có thể chuyển đổi dần
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

// Thêm phương thức tĩnh để kiểm tra số lượng sản phẩm theo khẩu phần
ingredientSchema.statics.checkAvailableQuantity = async function(productId, servingSize, requestedQuantity) {
    const product = await this.findById(productId);
    if (!product) return false;
    
    // Tìm khẩu phần phù hợp
    const portion = product.pricePerPortion.find(p => p.portion === servingSize);
    if (!portion) return false;
    
    // Nếu có quantity trong khẩu phần, kiểm tra nó
    if (portion.quantity !== undefined) {
        return portion.quantity >= requestedQuantity;
    }
    
    // Nếu không, sử dụng trường quantity chung (cho khả năng tương thích ngược)
    return product.quantity >= requestedQuantity;
};

// Thêm phương thức tĩnh để cập nhật số lượng sản phẩm theo khẩu phần
ingredientSchema.statics.updateQuantity = async function(productId, servingSize, quantityChange) {
    const product = await this.findById(productId);
    if (!product) return false;
    
    // Tìm khẩu phần phù hợp
    const portionIndex = product.pricePerPortion.findIndex(p => p.portion === servingSize);
    if (portionIndex === -1) return false;
    
    // Nếu có quantity trong khẩu phần, cập nhật nó
    if (product.pricePerPortion[portionIndex].quantity !== undefined) {
        product.pricePerPortion[portionIndex].quantity += quantityChange;
        
        // Đảm bảo số lượng không âm
        if (product.pricePerPortion[portionIndex].quantity < 0) {
            product.pricePerPortion[portionIndex].quantity = 0;
        }
    } else {
        // Nếu không, cập nhật trường quantity chung (cho khả năng tương thích ngược)
        product.quantity += quantityChange;
        
        // Đảm bảo số lượng không âm
        if (product.quantity < 0) {
            product.quantity = 0;
        }
    }
    
    // Cập nhật trạng thái sản phẩm dựa trên số lượng
    const anyAvailable = product.pricePerPortion.some(p => 
        (p.quantity !== undefined && p.quantity > 0) || product.quantity > 0
    );
    
    product.status = anyAvailable ? 'Còn hàng' : 'Hết hàng';
    
    return await product.save();
};

module.exports = mongoose.model('Ingredient', ingredientSchema); 
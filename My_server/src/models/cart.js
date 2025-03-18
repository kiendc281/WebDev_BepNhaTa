const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    accountId: {
        type: String,
        ref: 'Account',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.Mixed,
            ref: 'Ingredient',
            required: true
        },
        ingredientName: String,
        mainImage: String,
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        servingSize: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    listCart: [{
        ingredientId: {
            type: String,
            ref: 'Ingredient',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        totalPrice: {
            type: Number,
            required: true
        }
    }],
    totalQuantity: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema); 
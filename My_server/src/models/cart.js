const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    accountId: {
        type: String,
        ref: 'Account',
        required: true
    },
    items: [{
        productId: {
            type: String,
            ref: 'Ingredient',
            required: true
        },
        ingredientName: {
            type: String,
            required: true
        },
        mainImage: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        servingSize: {
            type: String,
            required: true,
            default: '2'
        },
        price: {
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
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    accountId: {
        type: String,
        ref: 'Account',
        required: true
    },
    items: [{
        productId: {
<<<<<<< HEAD
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
=======
>>>>>>> f192f1ed4680c78be1872138c4b836a61327f3f5
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
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    accountId: {
        type: String,
        ref: 'Account',
        required: true
    },
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
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Cart', cartSchema); 
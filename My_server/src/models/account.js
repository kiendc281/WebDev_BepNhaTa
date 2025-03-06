const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model('Account', accountSchema); 
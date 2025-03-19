const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
    accountId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Account',
        required: true
    },
    targetId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['blog', 'recipe', 'product'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Composite index to ensure a user can only favorite an item once
favoriteSchema.index({ accountId: 1, targetId: 1, type: 1 }, { unique: true });
favoriteSchema.index({ accountId: 1, type: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema); 
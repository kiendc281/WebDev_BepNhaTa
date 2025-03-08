const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    recipeName: {
        type: String,
        required: true
    },
    recipeImage: {
        type: String,
        required: true
    },
    servingsOptions: {
        type: Object
    },
    time: {
        type: String,
        required: true
    },
    difficulty: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    notes: String,
    preparation: [{
        type: Object
    }],
    steps: [{
        type: Object
    }],
    servingSuggestion: String,
    tips: String,
    relatedRecipeIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'recipes'
    }],
    suggestedIngredientIds: [{
        type: mongoose.Schema.Types.ObjectId
    }],
    tags: [String],
    likes: {
        type: Number,
        default: 0
    },
    region: String,
    category: String
}, {
    collection: 'recipes'
});

module.exports = mongoose.model('recipes', recipeSchema);
const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    _id: {
        type: String  // Định nghĩa _id là String
    },
    recipeName: String,
    recipeImage: String,
    servingsOptions: Object,
    time: String,
    difficulty: String,
    description: String,
    notes: String,
    preparation: [Object],
    steps: [Object],
    servingSuggestion: String,
    tips: String,
    tags: [String],
    likes: Number,
    region: String,
    category: String
}, { 
    collection: 'recipes',
    _id: false  // Tắt auto-generate _id
});

module.exports = mongoose.model('Recipe', recipeSchema);
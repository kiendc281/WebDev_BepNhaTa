const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
    menuId: {
        type: String,
        required: true,
        unique: true
    },
    ingredientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'menu',  // reference tới collection recipes
        required: true
    }
}, {
      
    collection: 'menu' // Tên collection trong MongoDB
});

module.exports = mongoose.model('menu', menuSchema);
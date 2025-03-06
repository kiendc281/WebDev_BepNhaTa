const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Account = new Schema({
    _id: { type: mongoose.Schema.Types.ObjectId },
    username: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, default: "customer" },
    name: { type: String, required: true },
    birthOfDate: { type: Date, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    collection: 'Accounts'
});

module.exports = mongoose.model('Account', Account); 